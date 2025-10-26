import os
from dotenv import load_dotenv
import pandas as pd
from pymongo import MongoClient

# 아래 기존 상대경로들 절대 경로로 변경해둔 것
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROCESSED_DIR = os.path.join(BASE_DIR, "../processed")
parking_csv = os.path.join(PROCESSED_DIR, "parking_clean.csv")
ev_csv = os.path.join(PROCESSED_DIR, "ev_charger_cleaned.csv")

# --------------------------
# 환경변수 로드
# --------------------------
load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")
print(MONGO_URI)

# --------------------------
# MongoDB 연결
# --------------------------
client = MongoClient(MONGO_URI)
db = client['seoul_smart_parking']  # 이미 만든 DB 이름

# --------------------------
# CSV 읽어서 컬렉션에 넣기
# --------------------------
# 1. 주차장

#절대경로로 변경함
#parking_csv = "C:/Users/hyoun/SeoulSmartParking/data/processed/parking_clean.csv"

parking_df = pd.read_csv(parking_csv)

# CSV -> dict list
parking_data = parking_df.to_dict(orient='records')

# 컬렉션에 삽입
db.parking.insert_many(parking_data)
print("✅ Parking 데이터 업로드 완료")

# 2. 전기차 충전소

#절대경로로 변경함
#ev_csv = "C:/Users/hyoun/SeoulSmartParking/data/processed/ev_charger_cleaned.csv"

ev_df = pd.read_csv(ev_csv)
ev_data = ev_df.to_dict(orient='records')
db.ev_charger.insert_many(ev_data)
print("✅ EV Charger 데이터 업로드 완료")
