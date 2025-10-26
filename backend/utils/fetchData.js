// backend/utils/fetchData.js
import axios from "axios";
import fs from "fs";
import path from "path";
import xml2js from "xml2js";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// backend/.env 명시적 로드
dotenv.config({ path: path.join(__dirname, "../.env") });

// 프로젝트 루트의 data/raw 폴더
const PROJECT_ROOT = path.join(__dirname, "..", "..");
const RAW_DIR = path.join(PROJECT_ROOT, "data", "raw");
if (!fs.existsSync(RAW_DIR)) fs.mkdirSync(RAW_DIR, { recursive: true });

// API 키
const SEOUL_PARKING_API_KEY = process.env.SEOUL_PARKING_API_KEY;
const SEOUL_EV_API_KEY = process.env.SEOUL_EV_API_KEY;

// 날짜 포맷 YYYYMMDD (예: 20251026)
function todayYYYYMMDD() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${dd}`;
}

// 기존 날짜붙은 파일(예: parking_1_1000_20251024.json) 삭제하고 새 파일만 남기기
function removePreviousDatedFiles(prefixName) {
  const list = fs.readdirSync(RAW_DIR);
  const re = new RegExp(`^${prefixName}_\\d{8}\\.json$`); // prefix_YYYYMMDD.json
  for (const f of list) {
    if (re.test(f)) {
      try { fs.unlinkSync(path.join(RAW_DIR, f)); } catch (e) { /* ignore */ }
    }
  }
}

// 저장 (덮어쓰기 방식은 '이전 dated 파일 제거 후 새날짜 파일 생성' 방식)
const saveJsonWithDate = (data, baseName) => {
  const date = todayYYYYMMDD();
  // baseName 예: "parking_1_1000" 또는 "evcharger_1_100"
  // 제거: 동일 baseName으로 날짜 붙은 이전 파일들 삭제
  removePreviousDatedFiles(baseName);
  const filename = `${baseName}_${date}.json`;
  const filePath = path.join(RAW_DIR, filename);
  // 메타 추가
  const payload = { ...data, _fetchedAt: new Date().toISOString() };
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf-8");
  console.log(`✅ 저장(덮어쓰기 형태): ${filePath}`);
};

// XML -> JSON 요청
const fetchXmlToJson = async (url, baseName) => {
  try {
    const res = await axios.get(url, { timeout: 15000 });
    const parser = new xml2js.Parser({ explicitArray: false });
    const data = await parser.parseStringPromise(res.data);
    saveJsonWithDate(data, baseName);
  } catch (err) {
    console.error(`❌ 요청 실패 (${url}): ${err.message}`);
    throw err;
  }
};

// 주차장 전체 (배치별)
export const fetchAllParkingData = async () => {
  const total = 6240;
  const batch = 1000;
  for (let start = 1; start <= total; start += batch) {
    const end = Math.min(start + batch - 1, total);
    const url = `http://openapi.seoul.go.kr:8088/${SEOUL_PARKING_API_KEY}/xml/GetParkInfo/${start}/${end}/`;
    const baseName = `parking_${start}_${end}`; // will become parking_1_1000_YYYYMMDD.json
    await fetchXmlToJson(url, baseName);
  }
};

// 전기차 충전소 전체 (배치별)
export const fetchAllEvData = async () => {
  const total = 311;
  const batch = 100;
  for (let start = 1; start <= total; start += batch) {
    const end = Math.min(start + batch - 1, total);
    const url = `http://openapi.seoul.go.kr:8088/${SEOUL_EV_API_KEY}/xml/evChargingStation/${start}/${end}/`;
    const baseName = `evcharger_${start}_${end}`; // evcharger_1_100_YYYYMMDD.json
    await fetchXmlToJson(url, baseName);
  }
};

// 전체 실행
export const fetchAllData = async () => {
  console.log("📌 데이터 수집 시작...");
  await fetchAllParkingData();
  await fetchAllEvData();
  console.log("📌 데이터 수집 완료");
};

// CLI로 직접 실행 가능
if (process.argv[1] && process.argv[1].endsWith('fetchData.js')) {
  fetchAllData();
}
