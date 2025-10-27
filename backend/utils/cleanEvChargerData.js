// backend/utils/cleanEvChargerData.js
import fs from "fs";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";
import Papa from "papaparse";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const PROJECT_ROOT = path.join(__dirname, "..", "..");
const RAW_DIR = path.join(PROJECT_ROOT, "data", "raw");
const PROCESSED_DIR = path.join(PROJECT_ROOT, "data", "processed");
const CACHE_DIR = path.join(PROJECT_ROOT, "data", "cache");
const CACHE_FILE = path.join(CACHE_DIR, "geocode_cache.json");
const VWORLD_API_KEY = process.env.VWORLD_API_KEY;

if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function preprocessAddress(address) {
  if (!address) return address;
  let a = String(address).replace(/\(.*?\)/g, "");
  const removeWords = [
    "출구", "층", "직진", "미터", "유료", "구획",
    "앞", "뒤", "좌측", "우측", "인근", "옆", "초입",
    "정문", "후문", "입구", "진입로", "정면"
  ];
  for (const w of removeWords) a = a.replaceAll(w, "");
  return a.replace(/\s+/g, " ").trim();
}

let addressCache = {};
try {
  if (fs.existsSync(CACHE_FILE)) {
    const raw = fs.readFileSync(CACHE_FILE, "utf-8");
    addressCache = raw ? JSON.parse(raw) : {};
  }
} catch {
  addressCache = {};
}

function saveCache() {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(addressCache, null, 2), "utf-8");
  } catch (e) {
    console.warn("[WARN] geocode cache save failed:", e.message || e);
  }
}

process.on("exit", saveCache);
process.on("SIGINT", () => { saveCache(); process.exit(); });
process.on("SIGTERM", () => { saveCache(); process.exit(); });

async function addressToCoord(address) {
  if (!address) return [null, null];
  const cleaned = preprocessAddress(address);
  if (addressCache[cleaned]) return addressCache[cleaned];

  if (!VWORLD_API_KEY) return [null, null];

  const url = "https://api.vworld.kr/req/address";
  const types = ["road", "parcel"];
  for (const type of types) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await axios.get(url, {
          params: {
            service: "address",
            request: "getcoord",
            crs: "epsg:4326",
            address: cleaned,
            format: "json",
            type,
            key: VWORLD_API_KEY
          },
          timeout: 9000
        });
        const point = res.data?.response?.result?.point;
        if (point?.x && point?.y) {
          const lat = parseFloat(point.y);
          const lon = parseFloat(point.x);
          addressCache[cleaned] = [lat, lon];
          return [lat, lon];
        }
      } catch (err) {
        await sleep(200 * attempt);
      }
    }
  }
  addressCache[cleaned] = [null, null];
  return [null, null];
}

function loadEvJson(filePath) {
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  return data?.evChargingStation?.row || [];
}

function listChosenEvFiles() {
  const files = fs.readdirSync(RAW_DIR).filter(f => f.startsWith("evcharger") && f.endsWith(".json"));
  return files;
}

export async function runCleanEvData() {
  const allRows = [];
  const filesToUse = listChosenEvFiles();
  let globalIndex = 0, processed = 0, geocodeSuccess = 0, geocodeFail = 0;

  for (const fname of filesToUse) {
    const rows = loadEvJson(path.join(RAW_DIR, fname));
    console.log(`[LOAD] 사용 파일: ${fname} (행 ${rows.length})`);
    for (const r of rows) {
      globalIndex++;
      processed++;

      const rawAddress = r.ADDR || r.ADDR_DTL || "";
      const [lat, lon] = await addressToCoord(rawAddress);
      await sleep(60);

      if (Number.isFinite(lat) && Number.isFinite(lon)) geocodeSuccess++;
      else geocodeFail++;

      allRows.push({
        oper_inst_nm: r.OPER_INST_NM || null,
        charging_station: r.CHARGING_STATION || null,
        charger_id: r.CHARGER_ID || null,
        charger_type: r.CHARGER_TYPE || null,
        fclt_se_l: r.FCLT_SE_L || null,
        fclt_se_s: r.FCLT_SE_S || null,
        region: r.RGN || null,
        sgg: r.SGG || null,
        address: rawAddress || null,
        utztn_psblty_tm: r.UTZTN_PSBLTY_TM || null,
        utztn_user_lmt: r.UTZTN_USER_LMT || null,
        charging_capacity: r.CHARGING_CAPACITY || null,
        con_pvsn: r.CON_PVSN || null,
        remark: r.RMRK || null,
        lat, lon
      });
    }
  }

  // 좌표 있는 데이터만
  const rowsWithCoords = allRows.filter(r => Number.isFinite(r.lat) && Number.isFinite(r.lon));
  console.log(`[INFO] processed=${processed}, geocodeSuccess=${geocodeSuccess}, geocodeFail=${geocodeFail}, kept=${rowsWithCoords.length}`);

  // 충전소별 그룹핑 + 정수형 resourceId
  const grouped = {};
  let stationIndex = 1; // 충전소별 정수 resourceId
  for (const r of rowsWithCoords) {
    const key = r.charging_station || `${r.address}_${r.lat}_${r.lon}`;
    if (!grouped[key]) {
      grouped[key] = { ...r, charger_count: 1, resourceId: stationIndex++ };
    } else {
      const g = grouped[key];
      g.charger_count += 1;
      g.lat = (g.lat * (g.charger_count - 1) + r.lat) / g.charger_count;
      g.lon = (g.lon * (g.charger_count - 1) + r.lon) / g.charger_count;
    }
  }

  const finalData = Object.values(grouped);
  if (!fs.existsSync(PROCESSED_DIR)) fs.mkdirSync(PROCESSED_DIR, { recursive: true });

  const fields = [
    "resourceId",
    "oper_inst_nm",
    "charging_station",
    "charger_id",
    "charger_type",
    "fclt_se_l",
    "fclt_se_s",
    "region",
    "sgg",
    "address",
    "utztn_psblty_tm",
    "utztn_user_lmt",
    "charging_capacity",
    "con_pvsn",
    "remark",
    "lat",
    "lon",
    "charger_count"
  ];

  const csv = Papa.unparse({ fields, data: finalData });
  const outPath = path.join(PROCESSED_DIR, "ev_charger_cleaned.csv");
  fs.writeFileSync(outPath, csv, "utf-8");

  saveCache();
  console.log(`[완료] 정제된 CSV 저장: ${outPath}`);
  console.log(`[INFO] 총 충전소 수 (grouped): ${finalData.length}`);
}

if (process.argv[1] && process.argv[1].endsWith("cleanEvChargerData.js")) {
  runCleanEvData();
}
