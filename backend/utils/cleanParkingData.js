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

// -------------- 유틸: 주소 전처리 --------------
function preprocessAddress(address) {
  if (!address) return address;
  // 소괄호 제거, 불필요 단어 제거, 공백 정리
  let a = String(address);
  a = a.replace(/\(.*?\)/g, "");
  const removeWords = [
    "출구", "층", "직진", "미터", "유료", "구획",
    "앞", "뒤", "좌측", "우측", "인근", "옆", "초입",
    "정문", "후문", "입구", "진입로", "정면"
  ];
  for (const w of removeWords) {
    a = a.replaceAll(w, "");
  }
  a = a.replace(/\s+/g, " ").trim();
  return a;
}

// -------------- 주소->좌표 변환 (캐시 + 재시도 + 타입 fallback) --------------
const addressCache = {}; // 메모리 캐시: address -> [lat, lon] or [null,null]

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function addressToCoord(address) {
  if (!address) return [null, null];
  const cleaned = preprocessAddress(address);
  if (!cleaned) return [null, null];
  if (addressCache.hasOwnProperty(cleaned)) return addressCache[cleaned];

  if (!VWORLD_API_KEY) {
    // 키가 없으면 바로 캐시 후 리턴 (좌표 없음)
    console.warn("[WARN] VWORLD_API_KEY not set — cannot geocode");
    addressCache[cleaned] = [null, null];
    return [null, null];
  }

  // 시도: 여러 번 재시도, 그리고 type을 road->parcel 순으로 시도
  const types = ["road", "parcel"];
  for (const type of types) {
    let attempt = 0;
    while (attempt < 3) {
      attempt++;
      try {
        // throttle: 짧게 대기 (API rate 제한 완화)
        if (attempt > 1) await sleep(200);
        const res = await axios.get(VWORLD_API_URL, {
          params: {
            service: "address",
            request: "getcoord",
            crs: "epsg:4326",
            address: cleaned,
            format: "json",
            type,
            key: VWORLD_API_KEY,
          },
          timeout: 7000,
        });

        const point = res.data?.response?.result?.point;
        if (point && point.x && point.y) {
          const lat = parseFloat(point.y);
          const lon = parseFloat(point.x);
          addressCache[cleaned] = [lat, lon];
          // 소량 로깅
          if (addressCache.__loggedCount === undefined) addressCache.__loggedCount = 0;
          addressCache.__loggedCount++;
          if (addressCache.__loggedCount % 50 === 0) {
            console.log(`[INFO] geocode successes so far: ${addressCache.__loggedCount}`);
          }
          return [lat, lon];
        } else {
          // 응답은 왔지만 포인트 없음 -> 바로 다음 시도(같은 type 반복 or fallback type)
          // break inner loop to try next type
          break;
        }
      } catch (err) {
        // 실패시 재시도 (로그는 간단히)
        console.log(`[DEBUG] geocode attempt ${attempt} failed for "${cleaned}" (type=${type}): ${err.message || err}`);
        // retry after backoff
        await sleep(150 * attempt);
      }
    }
    // 다음 type으로 넘어감 (road -> parcel)
  }

  // 모두 실패하면 캐시에 null로 저장
  addressCache[cleaned] = [null, null];
  return [null, null];
}

// =========================
// JSON 파일 로드 (날짜 처리 + 최신선택, 하이픈 포함)
// =========================
function loadParkingData() {
  const files = fs.readdirSync(RAW_DIR)
    .filter(f => f.startsWith("parking") && f.endsWith(".json"));

  const fileRe = /^(.+?)(?:_(\d{8}|\d{4}-\d{2}-\d{2}))?\.json$/;
  const groups = {};

  for (const fname of files) {
    const m = fname.match(fileRe);
    const baseKey = m ? m[1] : fname.replace(/\.json$/, "");
    const dateStr = m && m[2] ? m[2].replace(/-/g, "") : null;
    if (!groups[baseKey]) groups[baseKey] = [];
    groups[baseKey].push({ name: fname, dateStr });
  }

  const allRows = [];
  for (const baseKey of Object.keys(groups).sort()) {
    const list = groups[baseKey];
    const dated = list.filter(x => x.dateStr);
    let chosenName;
    if (dated.length > 0) {
      dated.sort((a, b) => b.dateStr.localeCompare(a.dateStr));
      chosenName = dated[0].name;
    } else {
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
// 데이터 정제: 필드 매핑 (모든 권장 칼럼 포함)
// =========================
async function cleanParkingData(rawRows) {
  // 제거할 컬럼(원본에서 아예 빼고 싶은 것들)
  const dropCols = ["BUS_PRK_CRG", "BUS_PRK_HM", "BUS_PRK_ADD_HM", "BUS_PRK_ADD_CRG"];

  const cleaned = [];
  let geocodeSuccess = 0;
  let geocodeFail = 0;
  let processedCount = 0;

  for (const row of rawRows) {
    processedCount++;
    // 불필요 컬럼 제거 (in-place)
    dropCols.forEach(c => delete row[c]);

    // 기본 매핑 (권장 칼럼 포함)
    const mapped = {
      // 필수/주요
      name: row.PKLT_NM || null,
      address: row.ADDR || null,
      code: row.PKLT_CD ? String(row.PKLT_CD) : null,
      // lat/lon: 우선 원본 LAT/LOT 사용 (문자열->숫자), 없으면 null(아래에서 변환 시도)
      lat: (row.LAT && String(row.LAT).trim() !== "") ? Number(row.LAT) : null,
      lon: (row.LOT && String(row.LOT).trim() !== "") ? Number(row.LOT) : null,
      // 권장(있으면 변환), 없으면 null
      total_parking: row.TPKCT ? Number(row.TPKCT) : null,
      basic_fee: row.PRK_CRG ? Number(row.PRK_CRG) : null,
      add_fee: row.ADD_CRG ? Number(row.ADD_CRG) : null,
      add_unit_min: row.ADD_UNIT_TM_MNT ? Number(row.ADD_UNIT_TM_MNT) : null,
      daily_max_fee: row.DLY_MAX_CRG ? Number(row.DLY_MAX_CRG) : null,
      prk_hm: row.PRK_HM || null,
      // 날짜 파싱: LAST_DATA_SYNC_TM -> ISO 형식(가능하면)
      last_sync: null,
      // 종류 코드/명
      pklt_knd: row.PKLT_KND || null,
      pklt_knd_nm: row.PKLT_KND_NM || null,
      // 추가 메타(원본 보존용)
      _raw: null,
    };

    // 원본 레코드 일부를 보관(문제가 있으면 조사용)
    // 단, 너무 큰 경우를 피하기 위해 필요한 몇개만 넣음
    mapped._raw = {
      OPER_SE: row.OPER_SE || null,
      OPER_SE_NM: row.OPER_SE_NM || null,
      TELNO: row.TELNO || null
    };

    // LAST_DATA_SYNC_TM 파싱
    if (row.LAST_DATA_SYNC_TM) {
      const parsed = Date.parse(row.LAST_DATA_SYNC_TM);
      if (!Number.isNaN(parsed)) mapped.last_sync = new Date(parsed).toISOString();
      else mapped.last_sync = null;
    }

    // 좌표가 없으면 주소 기반으로 변환 시도
    if (!(mapped.lat && mapped.lon)) {
      const [lat, lon] = await addressToCoord(mapped.address);
      if (lat && lon) {
        mapped.lat = lat;
        mapped.lon = lon;
        geocodeSuccess++;
      } else {
        geocodeFail++;
      }
      // 짧은 대기: API 쓰로틀 (너무 빠르게 돌리지 않게)
      await sleep(70);
    } else {
      // 이미 좌표가 있었음
      geocodeSuccess++;
    }

    // 규칙: 좌표 없으면 삭제(요구사항)
    if (!mapped.lat || !mapped.lon) {
      // skip record entirely (do not push)
      continue;
    }

    // 추가: resourceId 생성(주차장은 code 우선)
    mapped.resourceId = mapped.code ? String(mapped.code) : String((mapped.name || "") + "_" + (mapped.address || "")).slice(0, 200);

    cleaned.push(mapped);
  }

  console.log(`[좌표 변환 결과] 처리 ${processedCount}건 — 좌표 생성 성공: ${geocodeSuccess}, 실패(삭제): ${geocodeFail}`);
  // 중복 제거: name + address 기준, lat/lon 평균 (기존 코드 유지)
  const grouped = {};
  for (const r of cleaned) {
    const key = `${r.name || ''}_${r.address || ''}`;
    if (!grouped[key]) {
      grouped[key] = { ...r, count: 1 };
    } else {
      grouped[key].lat = (grouped[key].lat * grouped[key].count + r.lat) / (grouped[key].count + 1);
      grouped[key].lon = (grouped[key].lon * grouped[key].count + r.lon) / (grouped[key].count + 1);
      grouped[key].count += 1;
    }
  }

  const result = Object.values(grouped).map(obj => {
    const { count, ...rest } = obj;
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

  // CSV 필드 순서 명시 (원하는 칼럼들)
  const fields = [
    "resourceId","name","address","code","lat","lon",
    "total_parking","basic_fee","add_fee","add_unit_min","daily_max_fee",
    "prk_hm","last_sync","pklt_knd","pklt_knd_nm"
  ];
  const csv = Papa.unparse({ fields, data: cleanedData });
  const outPath = path.join(PROCESSED_DIR, "parking_clean.csv");
  fs.writeFileSync(outPath, csv, "utf-8");

  console.log(`✅ 정제 완료 및 저장: ${outPath}`);
}

// CLI 직접 실행 허용
if (process.argv[1] && process.argv[1].endsWith('cleanParkingData.js')) {
  runCleanParking();
}
