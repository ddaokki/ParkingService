import cron from 'node-cron';
import { exec } from 'child_process'; // <-- 자식 프로세스 실행 모듈
import path from 'path'; // <-- 경로 관련 모듈

// 파이썬 스크립트들이 있는 폴더 경로 설정
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(path.dirname(__filename));
const scriptsPath = path.join(__dirname, '../data/scripts/'); // backend 폴더 기준 상위 -> data -> scripts

// --- 파이썬 스크립트 실행 함수 ---
const runPythonScript = (scriptName) => {
  return new Promise((resolve, reject) => {
    // 'python3' 명령어와 스크립트 전체 경로를 합쳐서 실행
    const command = `python3 ${path.join(scriptsPath, scriptName)}`;
    console.log(`🚀 실행 중: ${command}`);

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ ${scriptName} 실행 오류: ${error.message}`);
        console.error(`   stderr: ${stderr}`);
        reject(error);
        return;
      }
      console.log(`✅ ${scriptName} 실행 완료:\n${stdout}`);
      resolve(stdout);
    });
  });
};

// --- 전체 파이썬 파이프라인 실행 함수 ---
const runUpdatePipeline = async () => {
  console.log('🔄 전체 데이터 업데이트 파이프라인 시작...');
  try {
    await runPythonScript('fetch_data.py'); // fetch
    await runPythonScript('clean_parking_data.py'); 
    await runPythonScript('clean_ev_charger_data.py');
    await runPythonScript('upload_to_db.py'); // db에 업로드
    console.log('🎉 전체 데이터 업데이트 파이프라인 완료!');
  } catch (pipelineError) {
    console.error('🔥 파이프라인 실행 중 심각한 오류 발생');
  }
};

const startScheduler = () => {
    // --- 주기적 실행 설정 (node-cron 사용) ---
    // 매일 새벽 6시 30분에 전체 파이프라인 실행 ('30 6 * * *')
    //console.log(__dirname)
    //console.log(scriptsPath)
    cron.schedule('30 6 * * *', () => {
        console.log('⏰ 스케줄된 시간입니다. 업데이트 파이프라인 시작...');
        runUpdatePipeline();
    });

    // 서버 시작 시 초기 실행
    //runUpdatePipeline();
    console.log('🕒 Cron 스케줄러 설정 완료. 매일 새벽 6시 30분에 파이썬 스크립트를 실행하여 DB를 업데이트 합니다.');
};

export default startScheduler;