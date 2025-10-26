// backend/utils/uploadToDb.js
import path from 'path';
import fs from 'fs';
import csv from 'csv-parser';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env (backend/.env) 명시적으로 로드
dotenv.config({ path: path.join(__dirname, "../.env") });

// 프로젝트 루트 기준 data 폴더
const PROJECT_ROOT = path.join(__dirname, "..", "..");
const PROCESSED_DIR = path.join(PROJECT_ROOT, 'data', 'processed');
const PARKING_CSV = path.join(PROCESSED_DIR, 'parking_clean.csv');
const EV_CSV = path.join(PROCESSED_DIR, 'ev_charger_cleaned.csv');

// =========================
// MongoDB 연결
// =========================
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) throw new Error('MONGO_URI 환경변수 설정 필요');

const client = new MongoClient(MONGO_URI);
const dbName = 'seoul_smart_parking';

// =========================
// CSV 읽기 함수
// =========================
async function readCsv(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    if (!fs.existsSync(filePath)) return resolve([]);
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (err) => reject(err));
  });
}

// =========================
// DB 업로드 함수 (bulk upsert)
// =========================
export async function runUploadToDb() {
  try {
    await client.connect();
    console.log('✅ MongoDB 연결 완료');
    const db = client.db(dbName);

    // Parking: upsert by code (PKLT_CD -> code)
    const parkingData = await readCsv(PARKING_CSV);
    if (parkingData.length > 0) {
      const parkingOps = parkingData.map(doc => {
        // ensure key exists
        const filter = doc.code ? { code: doc.code } : { name: doc.name, address: doc.address };
        return {
          updateOne: {
            filter,
            update: { $set: doc },
            upsert: true
          }
        };
      });
      if (parkingOps.length) {
        await db.collection('parking').bulkWrite(parkingOps, { ordered: false });
        console.log('✅ Parking 데이터 업로드(업서트) 완료');
      }
    } else {
      console.log('ℹ️ parking_clean.csv 파일 없음 또는 비어있음');
    }

    // EV Charger: upsert by charging_station
    const evData = await readCsv(EV_CSV);
    if (evData.length > 0) {
      const evOps = evData.map(doc => {
        const filter = doc.charging_station ? { charging_station: doc.charging_station } : { address: doc.address };
        return {
          updateOne: {
            filter,
            update: { $set: doc },
            upsert: true
          }
        };
      });
      if (evOps.length) {
        await db.collection('ev_charger').bulkWrite(evOps, { ordered: false });
        console.log('✅ EV Charger 데이터 업로드(업서트) 완료');
      }
    } else {
      console.log('ℹ️ ev_charger_cleaned.csv 파일 없음 또는 비어있음');
    }

  } catch (err) {
    console.error('❌ DB 업로드 오류:', err);
  } finally {
    await client.close();
    console.log('MongoDB 연결 종료');
  }
}

// CLI 직접 실행 가능
if (process.argv[1] && process.argv[1].endsWith('uploadToDb.js')) {
  runUploadToDb();
}
