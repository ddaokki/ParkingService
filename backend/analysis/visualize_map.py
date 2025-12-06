import pandas as pd
import folium
from folium.plugins import MarkerCluster
import os

# 1. 경로 설정
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
project_root = os.path.dirname(backend_dir) 

data_dir = os.path.join(project_root, "data", "processed")
output_dir = os.path.join(project_root, "data", "output_charts")

if not os.path.exists(output_dir):
    try: os.makedirs(output_dir)
    except: pass

def run_visualization():
    print("🗺️  데이터 분포 시각화 시작 (원형 모양 강제 적용)...")

    # 데이터 로드
    try:
        parking_df = pd.read_csv(os.path.join(data_dir, "parking_clean.csv")).dropna(subset=['lat', 'lon'])
        charger_df = pd.read_csv(os.path.join(data_dir, "ev_charger_cleaned.csv")).dropna(subset=['lat', 'lon'])
    except Exception as e:
        print(f"데이터 로드 실패: {e}")
        return

    m = folium.Map(location=[37.5665, 126.9780], zoom_start=11, tiles='CartoDB positron')

    # ============================================================
    # ★ [핵심] CSS 스타일 (배경 투명화 + 원형 강제)
    # ============================================================
    custom_css = """
    <style>
        /* 1. Leaflet 기본 DivIcon 스타일 초기화 (사각형 테두리 제거) */
        .custom-cluster-icon {
            background: transparent !important;
            border: none !important;
        }

        /* 2. 클러스터 원형 스타일 정의 */
        .cluster-base {
            border-radius: 50% !important; /* 무조건 원형 */
            text-align: center;
            font-weight: bold;
            color: white !important;
            border: 3px solid rgba(255, 255, 255, 0.5);
            box-shadow: 2px 2px 5px rgba(0,0,0,0.4);
            
            /* 내용물 중앙 정렬 */
            display: flex !important;
            align-items: center;
            justify-content: center;
        }

        /* --- 주차장 (파랑) 크기별 스타일 --- */
        .p-small {
            background-color: rgba(49, 134, 204, 0.85) !important;
            width: 30px !important; height: 30px !important; font-size: 12px;
        }
        .p-medium {
            background-color: rgba(49, 134, 204, 0.9) !important;
            width: 50px !important; height: 50px !important; font-size: 14px;
        }
        .p-large {
            background-color: rgba(49, 134, 204, 0.95) !important;
            width: 70px !important; height: 70px !important; font-size: 16px;
        }

        /* --- 충전소 (초록) 크기별 스타일 --- */
        .c-small {
            background-color: rgba(46, 204, 113, 0.85) !important;
            width: 30px !important; height: 30px !important; font-size: 12px;
        }
        .c-medium {
            background-color: rgba(46, 204, 113, 0.9) !important;
            width: 50px !important; height: 50px !important; font-size: 14px;
        }
        .c-large {
            background-color: rgba(46, 204, 113, 0.95) !important;
            width: 70px !important; height: 70px !important; font-size: 16px;
        }
    </style>
    """
    m.get_root().html.add_child(folium.Element(custom_css))

    # ============================================================
    # 2. 자바스크립트 로직 (className 변경)
    # ============================================================
    
    # 주차장 (파랑)
    icon_create_function_parking = """
    function(cluster) {
        var count = cluster.getChildCount();
        var sizeClass = 'p-small';
        
        if (count >= 100) { sizeClass = 'p-large'; }
        else if (count >= 10) { sizeClass = 'p-medium'; }
        
        return new L.DivIcon({
            html: '<div class="cluster-base ' + sizeClass + '"><span>' + count + '</span></div>',
            className: 'custom-cluster-icon', // ★ 기본 스타일 간섭 방지
            iconSize: new L.Point(40, 40)
        });
    }
    """

    # 충전소 (초록)
    icon_create_function_charging = """
    function(cluster) {
        var count = cluster.getChildCount();
        var sizeClass = 'c-small';
        
        if (count >= 100) { sizeClass = 'c-large'; }
        else if (count >= 10) { sizeClass = 'c-medium'; }
        
        return new L.DivIcon({
            html: '<div class="cluster-base ' + sizeClass + '"><span>' + count + '</span></div>',
            className: 'custom-cluster-icon', // ★ 기본 스타일 간섭 방지
            iconSize: new L.Point(40, 40)
        });
    }
    """

    # ============================================================
    # 3. 데이터 추가
    # ============================================================
    
    parking_cluster = MarkerCluster(
        name='주차장 (Blue)',
        icon_create_function=icon_create_function_parking, 
        overlay=True, control=True
    ).add_to(m)
    
    for _, row in parking_df.iterrows():
        name = str(row['name']) if pd.notna(row['name']) else "미상"
        folium.CircleMarker(
            location=[row['lat'], row['lon']], radius=5,
            color='#3186cc', fill=True, fill_color='#3186cc', fill_opacity=0.8,
            tooltip=f"🅿️ {name}"
        ).add_to(parking_cluster)

    charger_cluster = MarkerCluster(
        name='충전소 (Green)',
        icon_create_function=icon_create_function_charging, 
        overlay=True, control=True
    ).add_to(m)
    
    for _, row in charger_df.iterrows():
        name = str(row['charging_station']) if pd.notna(row['charging_station']) else "미상"
        folium.CircleMarker(
            location=[row['lat'], row['lon']], radius=5,
            color='#2ecc71', fill=True, fill_color='#2ecc71', fill_opacity=0.8,
            tooltip=f"⚡ {name}"
        ).add_to(charger_cluster)

    folium.LayerControl().add_to(m)
    
    # 파일명: seoul_map_circle.html
    save_path = os.path.join(output_dir, "seoul_map_circle.html")
    m.save(save_path)
    
    print("-" * 50)
    print(f"✅ (원형 + 크기/색상 적용) 시각화 완료!")
    print(f"👉 파일 위치: {save_path}")
    print("-" * 50)

if __name__ == "__main__":
    run_visualization()