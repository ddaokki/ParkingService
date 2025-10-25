import requests
import xmltodict
import json
import os
from datetime import datetime
from dotenv import load_dotenv
load_dotenv()

# === 절대경로 기준 raw 폴더 생성 ===
BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # scripts 폴더 기준
RAW_DIR = os.path.join(BASE_DIR, "../raw")
os.makedirs(RAW_DIR, exist_ok=True)
print(f"📁 raw 폴더 위치: {RAW_DIR}")

# === API 키 ===
SEOUL_API_KEY = os.getenv("SEOUL_API_KEY")   

# === JSON 저장 함수 ===
def save_json(data, filename):
    file_path = os.path.join(RAW_DIR, filename)
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"✅ 파일 저장 완료: {file_path}")

# === XML → JSON 변환 요청 함수 ===
def fetch_xml_to_json(url, filename):
    try:
        response = requests.get(url, timeout=10)
        response.encoding = "utf-8"
        if response.status_code == 200:
            data_dict = xmltodict.parse(response.text)
            save_json(data_dict, filename)
        else:
            print(f"⚠️ 요청 실패: {response.status_code} - {url}")
    except Exception as e:
        print(f"❌ 요청 중 예외 발생: {e} - {url}")

# === 1. 서울시 주차장 정보 (6240개) ===
def fetch_all_parking_data():
    total_records = 6240
    batch_size = 1000
    for start in range(1, total_records + 1, batch_size):
        end = min(start + batch_size - 1, total_records)
        url = f"http://openapi.seoul.go.kr:8088/{SEOUL_API_KEY}/xml/GetParkInfo/{start}/{end}/"
        filename = f"parking_{start}_{end}_{datetime.now().strftime('%Y%m%d')}.json"
        fetch_xml_to_json(url, filename)

# === 2. 전기차 충전소 정보 (311개) ===
def fetch_all_ev_data():
    total_records = 311
    batch_size = 100
    for start in range(1, total_records + 1, batch_size):
        end = min(start + batch_size - 1, total_records)
        url = f"http://openapi.seoul.go.kr:8088/{SEOUL_API_KEY}/xml/evChargingStation/{start}/{end}/"
        filename = f"evcharger_{start}_{end}_{datetime.now().strftime('%Y%m%d')}.json"
        fetch_xml_to_json(url, filename)

# === 실행 ===
if __name__ == "__main__":
    print("📌 데이터 수집 시작...")
    fetch_all_parking_data()
    fetch_all_ev_data()
    print("📌 데이터 수집 완료")
