# clean_ev_charger_data.py
import os
import json
import pandas as pd
import requests
from time import sleep
import re
from dotenv import load_dotenv
load_dotenv()
# ----------------------------
# 설정
# ----------------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
RAW_DATA_DIR = os.path.join(BASE_DIR, "../raw")
PROCESSED_DATA_DIR = os.path.join(BASE_DIR, "../processed")
VWorld_API_KEY = os.getenv("VWORLD_API_KEY")

#절대경로로 변경함
#RAW_DATA_DIR = "C:/Users/hyoun/SeoulSmartParking/data/raw"
#PROCESSED_DATA_DIR = "C:/Users/hyoun/SeoulSmartParking/data/processed"


# ----------------------------
# 주소 전처리 함수
# ----------------------------
def preprocess_address(address):
    """
    좌표 변환 실패 주소를 위해 불필요 단어 제거
    """
    if not address:
        return address

    # 소괄호 안 내용 제거 (건물명, 부속시설 등)
    address = re.sub(r'\(.*?\)', '', address)

    # 층, 출구, 직진 거리, 구획, 반복 단어 제거
    remove_words = [
        "출구", "층", "직진", "M", "미터", "유료", "구획",
        "앞", "뒤", "좌측", "우측", "인근", "옆", "초입",
        "정문", "후문", "입구", "진입로", "정면"
    ]
    for w in remove_words:
        address = address.replace(w, "")

    # 공백 정리
    address = re.sub(r'\s+', ' ', address).strip()

    return address

# ----------------------------
# 주소 -> 좌표 변환 함수 (캐싱 + 디버깅)
# ----------------------------
address_cache = {}

def address_to_coord(address):
    """
    브이월드 주소 -> 좌표 변환. 실패 시 None 반환
    """
    if not address:
        return None, None

    # 전처리
    address = preprocess_address(address)

    if address in address_cache:
        return address_cache[address]

    api_url = "https://api.vworld.kr/req/address?"
    params = {
        "service": "address",
        "request": "getcoord",
        "crs": "epsg:4326",
        "address": address,
        "format": "json",
        "type": "road",
        "key": VWorld_API_KEY
    }

    try:
        response = requests.get(api_url, params=params, timeout=5)
        if response.status_code != 200:
            print(f"[DEBUG] API 실패 {response.status_code} / {address}")
            address_cache[address] = (None, None)
            return None, None

        data = response.json()
        point = data.get("response", {}).get("result", {}).get("point")
        if point:
            lat, lon = float(point["y"]), float(point["x"])
            address_cache[address] = (lat, lon)
            print(f"[DEBUG] 변환 성공: {address} -> ({lat}, {lon})")
            return lat, lon
        else:
            print(f"[DEBUG] 좌표 없음: {address}")
            address_cache[address] = (None, None)
            return None, None

    except Exception as e:
        print(f"[DEBUG] 변환 예외: {address} / {e}")
        address_cache[address] = (None, None)
        return None, None

# ----------------------------
# JSON 불러오기
# ----------------------------
def load_ev_json(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)
        return data.get("evChargingStation", {}).get("row", [])

# ----------------------------
# 데이터 정제 및 통합
# ----------------------------
def clean_ev_data():
    all_rows = []

    for file_name in os.listdir(RAW_DATA_DIR):
        if file_name.startswith("evcharger") and file_name.endswith(".json"):
            file_path = os.path.join(RAW_DATA_DIR, file_name)
            rows = load_ev_json(file_path)
            print(f"[DEBUG] {file_name} 로드 완료, 행 개수: {len(rows)}")

            for r in rows:
                raw_address = r.get("ADDR")
                lat, lon = address_to_coord(raw_address)
                sleep(0.05)

                all_rows.append({
                    "oper_inst_nm": r.get("OPER_INST_NM"),
                    "charging_station": r.get("CHARGING_STATION"),
                    "charger_id": r.get("CHARGER_ID"),
                    "charger_type": r.get("CHARGER_TYPE"),
                    "fclt_se_l": r.get("FCLT_SE_L"),
                    "fclt_se_s": r.get("FCLT_SE_S"),
                    "region": r.get("RGN"),
                    "sgg": r.get("SGG"),
                    "address": raw_address,
                    "utztn_psblty_tm": r.get("UTZTN_PSBLTY_TM"),
                    "utztn_user_lmt": r.get("UTZTN_USER_LMT"),
                    "charging_capacity": r.get("CHARGING_CAPACITY"),
                    "con_pvsn": r.get("CON_PVSN"),
                    "remark": r.get("RMRK"),
                    "lat": lat,
                    "lon": lon
                })

    df = pd.DataFrame(all_rows)

    # ----------------------------
    # 중복 통합: 충전소 기준
    # ----------------------------
    grouped = df.groupby("charging_station").agg({
        "oper_inst_nm": "first",
        "fclt_se_l": "first",
        "fclt_se_s": "first",
        "region": "first",
        "sgg": "first",
        "address": "first",
        "utztn_psblty_tm": "first",
        "lat": "first",
        "lon": "first",
        "charger_id": "count"  # 충전기 개수
    }).rename(columns={"charger_id": "charger_count"}).reset_index()

    os.makedirs(PROCESSED_DATA_DIR, exist_ok=True)
    save_path = os.path.join(PROCESSED_DATA_DIR, "ev_charger_cleaned.csv")
    grouped.to_csv(save_path, index=False, encoding="utf-8-sig")
    print(f"[완료] 정제된 CSV 저장: {save_path}")
    print(f"[INFO] 총 충전소 수: {len(grouped)}")

# ----------------------------
# 메인 실행
# ----------------------------
if __name__ == "__main__":
    clean_ev_data()
