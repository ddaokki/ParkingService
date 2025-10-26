// backend/utils/cleanEvChargerData.js
import fs from "fs";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";
import Papa from "papaparse";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env (backend/.env) 명시적으로 로드
dotenv.config({ path: path.join(__dirname, "../.env") });

// 프로젝트 루트 기준 data 폴더
const PROJECT_ROOT = path.join(__dirname, "..", "..");
const RAW_DIR = path.join(PROJECT_ROOT, "data", "raw");
const PROCESSED_DIR = path.join(PROJECT_ROOT, "data", "processed");

const VWORLD_API_KEY = process.env.VWORLD_API_KEY;

// =========================
// 주소 전처리
// =========================
function preprocessAddress(address) {
  if (!address) return address;

  address = address.replace(/\(.*?\)/g, ""); // 소괄호 제거
  const removeWords = [
    "출구", "층", "직진", "M", "미터", "유료", "구획",
    "앞", "뒤", "좌측", "우측", "인근", "옆", "초입",
    "정문", "후문", "입구", "진입로", "정면"
  ];
  removeWords.forEach(w => {
    address = address.replaceAll(w, "");
  });

  address = address.replace(/\s+/g, " ").trim();
  return address;
}

// =========================
// 주소 → 좌표 변환 (캐싱)
// =========================
const addressCache = {};

async function addressToCoord(address) {
  if (!address) return [null, null];

  address = preprocessAddress(address);
  if (addressCache[address]) return addressCache[address];

  const url = "https://api.vworld.kr/req/address";
  try {
    const res = await axios.get(url, {
      params: {
        service: "address",
        request: "getcoord",
        crs: "epsg:4326",
        address,
        format: "json",
        type: "road",
        key: VWORLD_API_KEY
      },
      timeout: 5000
    });

    const point = res.data?.response?.result?.point;
    if (point) {
      const lat = parseFloat(point.y);
      const lon = parseFloat(point.x);
      addressCache[address] = [lat, lon];
      console.log(`[DEBUG] 변환 성공: ${address} -> (${lat}, ${lon})`);
      return [lat, lon];
    } else {
      console.log(`[DEBUG] 좌표 없음: ${address}`);
      addressCache[address] = [null, null];
      return [null, null];
    }
  } catch (e) {
    console.log(`[DEBUG] 변환 예외: ${address} / ${e.message || e}`);
    addressCache[address] = [null, null];
    return [null, null];
  }
}

// =========================
// JSON 파일 로드
// =========================
function loadEvJson(filePath) {
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  // 기존 파이썬 구조에 맞게
  return data?.evChargingStation?.row || [];
}

// =========================
// 파일 선택: 그룹별 최신 파일 선택 (날짜 형식 YYYYMMDD 또는 YYYY-MM-DD 지원)
// =========================
function listChosenEvFiles() {
  const files = fs.readdirSync(RAW_DIR)
    .filter(f => f.startsWith("evcharger") && f.endsWith(".json"));

  const fileRe = /^(.+?)(?:_(\d{8}|\d{4}-\d{2}-\d{2}))?\.json$/;
  const groups = {};

  for (const fname of files) {
    const m = fname.match(fileRe);
    const baseKey = m ? m[1] : fname.replace(/\.json$/, "");
    const dateStr = m && m[2] ? m[2].replace(/-/g, "") : null; // normalize
    if (!groups[baseKey]) groups[baseKey] = [];
    groups[baseKey].push({ name: fname, dateStr });
  }

  const chosen = [];
  for (const baseKey of Object.keys(groups).sort()) {
    const list = groups[baseKey];
    const dated = list.filter(x => x.dateStr);
    let chosenName;
    if (dated.length > 0) {
      dated.sort((a, b) => b.dateStr.localeCompare(a.dateStr)); // 최신 우선
      chosenName = dated[0].name;
    } else {
      chosenName = list[0].name;
    }
    chosen.push(chosenName);
  }
  return chosen;
}

// =========================
// 데이터 정제
// =========================
export async function runCleanEvData() {
  const allRows = [];

  const filesToUse = listChosenEvFiles();
  if (filesToUse.length === 0) {
    console.log("ℹ️ 처리할 evcharger raw 파일이 없습니다.");
  }

  for (const fname of filesToUse) {
    const rows = loadEvJson(path.join(RAW_DIR, fname));
    console.log(`[LOAD] 사용 파일: ${fname} (행 ${rows.length})`);

    for (const r of rows) {
      const rawAddress = r.ADDR;
      const [lat, lon] = await addressToCoord(rawAddress);
      // 과도한 호출 방지
      await new Promise(res => setTimeout(res, 50));

      allRows.push({
        oper_inst_nm: r.OPER_INST_NM,
        charging_station: r.CHARGING_STATION,
        charger_id: r.CHARGER_ID,
        charger_type: r.CHARGER_TYPE,
        fclt_se_l: r.FCLT_SE_L,
        fclt_se_s: r.FCLT_SE_S,
        region: r.RGN,
        sgg: r.SGG,
        address: rawAddress,
        utztn_psblty_tm: r.UTZTN_PSBLTY_TM,
        utztn_user_lmt: r.UTZTN_USER_LMT,
        charging_capacity: r.CHARGING_CAPACITY,
        con_pvsn: r.CON_PVSN,
        remark: r.RMRK,
        lat,
        lon
      });
    }
  }

  // ------------------------
  // 중복 통합: charging_station 기준 (없으면 address+coords로 대체)
  // ------------------------
  const grouped = {};
  for (const r of allRows) {
    const key = r.charging_station || `${r.address}_${r.lat}_${r.lon}`;
    if (!grouped[key]) {
      grouped[key] = { ...r, charger_count: 1 };
    } else {
      grouped[key].charger_count += 1;
    }
  }

  const finalData = Object.values(grouped);

  if (!fs.existsSync(PROCESSED_DIR)) fs.mkdirSync(PROCESSED_DIR, { recursive: true });
  const csv = Papa.unparse(finalData);
  const outPath = path.join(PROCESSED_DIR, "ev_charger_cleaned.csv");
  fs.writeFileSync(outPath, csv, "utf-8");

  console.log(`[완료] 정제된 CSV 저장: ${outPath}`);
  console.log(`[INFO] 총 충전소 수: ${finalData.length}`);
}

// CLI 직접 실행 허용 (안전하게)
if (process.argv[1] && process.argv[1].endsWith('cleanEvChargerData.js')) {
  runCleanEvData();
}
