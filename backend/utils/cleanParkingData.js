// backend/utils/cleanParkingData.js
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
const VWORLD_API_URL = "https://api.vworld.kr/req/address";

// =========================
// 주소 → 좌표 변환
// =========================
async function addressToCoord(address) {
  try {
    const res = await axios.get(VWORLD_API_URL, {
      params: {
        service: "address",
        request: "getcoord",
        crs: "epsg:4326",
        address,
        format: "json",
        type: "road",
        key: VWORLD_API_KEY,
      },
      timeout: 5000,
    });

    const data = res.data;
    if (data?.response?.status === "OK") {
      const point = data.response.result.point;
      return [parseFloat(point.y), parseFloat(point.x)]; // [lat, lon]
    }
  } catch (e) {
    // 실패 시 null 반환
  }
  return [null, null];
}

// =========================
// JSON 파일 로드 (날짜 처리 + 최신선택, 하이픈 포함)
// =========================
function loadParkingData() {
  const files = fs.readdirSync(RAW_DIR)
    .filter(f => f.startsWith("parking") && f.endsWith(".json"));

  // 파일명 패턴: <base>[_YYYYMMDD or _YYYY-MM-DD].json
  // 캡처: base, date (optional)
  const fileRe = /^(.+?)(?:_(\d{8}|\d{4}-\d{2}-\d{2}))?\.json$/;

  const groups = {}; // baseKey -> [{name, dateStr|null}...]

  for (const fname of files) {
    const m = fname.match(fileRe);
    if (!m) {
      // 패턴에 맞지 않으면 그냥 base = fname without .json
      const baseKey = fname.replace(/\.json$/, "");
      if (!groups[baseKey]) groups[baseKey] = [];
      groups[baseKey].push({ name: fname, dateStr: null });
      continue;
    }
    const baseKey = m[1]; // 예: parking_1_1000
    const rawDate = m[2] || null;
    const dateStr = rawDate ? rawDate.replace(/-/g, "") : null; // normalize to YYYYMMDD
    if (!groups[baseKey]) groups[baseKey] = [];
    groups[baseKey].push({ name: fname, dateStr });
  }

  const allRows = [];

  // 각 그룹에서 최신 날짜 파일 선택 (없으면 undated 선택)
  for (const baseKey of Object.keys(groups).sort()) {
    const list = groups[baseKey];
    // dated들만 골라서 최신 선택
    const dated = list.filter(x => x.dateStr);
    let chosenName;
    if (dated.length > 0) {
      dated.sort((a, b) => b.dateStr.localeCompare(a.dateStr)); // 내림차순 -> 최신이 앞
      chosenName = dated[0].name;
    } else {
      // 날짜 없는 파일들 중 첫번째 사용
      chosenName = list[0].name;
    }

    try {
      const filePath = path.join(RAW_DIR, chosenName);
      const jsonData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      const rows = jsonData?.GetParkInfo?.row || [];
      console.log(`[LOAD] 사용 파일: ${chosenName} (행 ${rows.length})`);
      allRows.push(...rows);
    } catch (err) {
      console.error(`[ERROR] 파일 로드 실패: ${chosenName} ->`, err.message);
    }
  }

  return allRows;
}


// =========================
// 데이터 정제
// =========================
async function cleanParkingData(rawRows) {
  const dropCols = ["BUS_PRK_CRG", "BUS_PRK_HM", "BUS_PRK_ADD_HM", "BUS_PRK_ADD_CRG"];
  const cleaned = [];
  let success = 0,
      fail = 0;

  for (const row of rawRows) {
    // 불필요 컬럼 제거
    dropCols.forEach(c => delete row[c]);

    // 컬럼 이름 간단화
    const r = {
      name: row.PKLT_NM,
      address: row.ADDR,
      code: row.PKLT_CD,
      lat: row.LAT ? parseFloat(row.LAT) : null,
      lon: row.LOT ? parseFloat(row.LOT) : null,
      total_parking: row.TPKCT,
      basic_fee: row.PRK_CRG,
    };

    // 좌표 없으면 주소 기반 변환
    if (!r.lat || !r.lon) {
      const [lat, lon] = await addressToCoord(r.address);
      if (lat && lon) {
        r.lat = lat;
        r.lon = lon;
        success++;
      } else {
        fail++;
      }
    } else {
      success++;
    }

    cleaned.push(r);
  }

  console.log(`[좌표 변환 결과] 성공 ${success}건, 실패 ${fail}건`);

  // 좌표 없는 데이터 제거
  const finalData = cleaned.filter(r => r.lat && r.lon);

  // 중복 제거: name + address 기준, lat/lon 평균
  const grouped = {};
  finalData.forEach(r => {
    const key = `${r.name}_${r.address}`;
    if (!grouped[key]) {
      grouped[key] = { ...r, count: 1 };
    } else {
      grouped[key].lat = (grouped[key].lat * grouped[key].count + r.lat) / (grouped[key].count + 1);
      grouped[key].lon = (grouped[key].lon * grouped[key].count + r.lon) / (grouped[key].count + 1);
      grouped[key].count += 1;
    }
  });

  const result = Object.values(grouped).map(r => {
    const { count, ...rest } = r;
    return rest;
  });

  console.log(`[최종 저장 개수] ${result.length}건`);
  return result;
}

// =========================
// 메인 실행
// =========================
export async function runCleanParking() {
  const rawRows = loadParkingData();
  const cleanedData = await cleanParkingData(rawRows);

  if (!fs.existsSync(PROCESSED_DIR)) fs.mkdirSync(PROCESSED_DIR, { recursive: true });

  const csv = Papa.unparse(cleanedData);
  const outPath = path.join(PROCESSED_DIR, "parking_clean.csv");
  fs.writeFileSync(outPath, csv, "utf-8");

  console.log(`✅ 정제 완료 및 저장: ${outPath}`);
}

// CLI 직접 실행 허용
if (process.argv[1] && process.argv[1].endsWith('cleanParkingData.js')) {
  runCleanParking();
}
