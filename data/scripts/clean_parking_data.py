# clean_parking_data.py
import json
import os
import pandas as pd
import requests
from datetime import datetime
from dotenv import load_dotenv
load_dotenv()
# =========================
# 설정
# =========================
RAW_DIR = "C:/Users/hyoun/SeoulSmartParking/data/raw"
PROCESSED_DIR = "C:/Users/hyoun/SeoulSmartParking/data/processed"

VWORLD_API_KEY = os.getenv("VWORLD_API_KEY")
VWORLD_API_URL = "https://api.vworld.kr/req/address"

# =========================
# 브이월드 주소 → 좌표 변환 함수
# =========================
def address_to_coord(address):
    params = {
        "service": "address",
        "request": "getcoord",
        "crs": "epsg:4326",
        "address": address,
        "format": "json",
        "type": "road",
        "key": VWORLD_API_KEY
    }
    try:
        response = requests.get(VWORLD_API_URL, params=params, timeout=5)
        data = response.json()
        if data.get("response", {}).get("status") == "OK":
            coord = data["response"]["result"]["point"]
            return float(coord["y"]), float(coord["x"])  # 위도, 경도
    except Exception:
        pass
    return None, None

# =========================
# JSON 파일 로드
# =========================
def load_parking_data():
    parking_files = [f for f in os.listdir(RAW_DIR) if f.startswith("parking")]
    all_rows = []
    for fname in parking_files:
        path = os.path.join(RAW_DIR, fname)
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
            rows = data.get("GetParkInfo", {}).get("row", [])
            all_rows.extend(rows)
    return pd.DataFrame(all_rows)

# =========================
# 데이터 정제
# =========================
def clean_parking_data(df):
    # -------------------------
    # 필요 없는 버스 관련 컬럼 제거
    # -------------------------
    drop_cols = ["BUS_PRK_CRG", "BUS_PRK_HM", "BUS_PRK_ADD_HM", "BUS_PRK_ADD_CRG"]
    df = df.drop(columns=[c for c in drop_cols if c in df.columns])

    # -------------------------
    # 컬럼 이름 간단화 (일부)
    # -------------------------
    df = df.rename(columns={
        "PKLT_NM": "name",
        "ADDR": "address",
        "PKLT_CD": "code",
        "LAT": "lat",
        "LOT": "lon",
        "TPKCT": "total_parking",
        "PRK_CRG": "basic_fee",
    })

    # -------------------------
    # 좌표 변환 (위도/경도 없으면 주소 기반)
    # -------------------------
    success, fail = 0, 0
    lats, lons = [], []

    for i, row in df.iterrows():
        lat, lon = row.get("lat"), row.get("lon")
        if pd.isna(lat) or pd.isna(lon) or str(lat).strip() == "" or str(lon).strip() == "":
            lat, lon = address_to_coord(row.get("address", ""))
            if lat and lon:
                success += 1
            else:
                fail += 1
        else:
            success += 1
        lats.append(lat)
        lons.append(lon)

    df["lat"] = lats
    df["lon"] = lons
    print(f"[좌표 변환 결과] 성공 {success}건, 실패 {fail}건")

    # -------------------------
    # 좌표 타입 변환
    # -------------------------
    df["lat"] = pd.to_numeric(df["lat"], errors="coerce")
    df["lon"] = pd.to_numeric(df["lon"], errors="coerce")

    # -------------------------
    # 대표 좌표 1개 (중복 제거)
    # -------------------------
    # 나머지 컬럼은 모두 first로 유지
    group_cols = ["name", "address"]
    agg_dict = {col: "first" for col in df.columns if col not in group_cols + ["lat", "lon"]}
    agg_dict.update({"lat": "mean", "lon": "mean"})
    df = df.groupby(group_cols, as_index=False).agg(agg_dict)

    # -------------------------
    # 좌표 없는 데이터 제거
    # -------------------------
    df = df.dropna(subset=["lat", "lon"])
    print(f"[최종 저장 개수] {len(df)}건")

    return df

# =========================
# 메인 실행
# =========================
if __name__ == "__main__":
    df_raw = load_parking_data()
    df_clean = clean_parking_data(df_raw)

    os.makedirs(PROCESSED_DIR, exist_ok=True)
    output_path = os.path.join(PROCESSED_DIR, "parking_clean.csv")
    df_clean.to_csv(output_path, index=False, encoding="utf-8-sig")

    print(f"✅ 정제 완료 및 저장: {output_path}")
