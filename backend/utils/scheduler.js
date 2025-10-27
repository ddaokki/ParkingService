// backend/utils/scheduler.js
import cron from 'node-cron';
import path from 'path';
import { fileURLToPath } from 'url';
import { runUploadToDb } from './uploadToDb.js';
import { fetchAllData } from './fetchData.js';
import { runCleanParking } from './cleanParkingData.js';
import { runCleanEvData } from './cleanEvChargerData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runUpdatePipeline = async () => {
  console.log('🔄 전체 데이터 업데이트 시작...');
  try {
    await fetchAllData();
    await runCleanParking();
    await runCleanEvData();
    await runUploadToDb();
    console.log('🎉 전체 파이프라인 완료!');
  } catch (err) {
    console.error('🔥 파이프라인 실행 중 오류 발생', err);
  }
};

const startScheduler = () => {
  // mm hh dd mm yy ( 설정 시간 포맷 (24시간제) )
  cron.schedule('27 0 * * *', async () => {
    console.log('⏰ 스케줄 시간 도착! 파이프라인 실행...');
    try {
      await runUpdatePipeline();
    } catch (e) {
      console.error('🔥 스케줄러 실행 오류', e);
    }
  });

  console.log('🕒 Cron 스케줄러 설정 완료');
  console.log('- 설정한 시간에 몽고 db에 업데이트');
  console.log('- backend/utils/scheduler.js에서 설정 시간 확인');
};

export default startScheduler;

// standalone 실행 허용
if (process.argv[1] && process.argv[1].endsWith('scheduler.js')) {
  runUpdatePipeline();
}
