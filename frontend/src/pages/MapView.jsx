/* global kakao */
import React, { useEffect, useState } from "react";
import { getCurrentPosition } from "../utils/getLocation";
import axios from "axios";

export default function MapViewKakao() {
  const [map, setMap] = useState(null);
  const [myPos, setMyPos] = useState(null);
  const [parkings, setParkings] = useState([]);

  // 1️⃣ 내 위치 받아오기
  useEffect(() => {
    getCurrentPosition()
      .then(setMyPos)
      .catch((err) => console.error("위치 정보를 가져오지 못했습니다:", err));
  }, []);

  // 2️⃣ Kakao 지도 로드
  useEffect(() => {
    if (!myPos) return;

    const KAKAO_KEY = process.env.REACT_APP_KAKAO_API_KEY;
    if (!KAKAO_KEY) {
      console.error("Kakao API 키가 설정되어 있지 않습니다 (.env 확인)");
      return;
    }

    // Kakao SDK 스크립트 동적 로드
    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&autoload=false`;
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      kakao.maps.load(() => {
        // 지도 생성
        const mapContainer = document.getElementById("kmap");
        const loc = new kakao.maps.LatLng(myPos.lat, myPos.lon);
        const map = new kakao.maps.Map(mapContainer, {
          center: loc,
          level: 5,
        });
        setMap(map);

        // 내 위치 마커
        const myMarker = new kakao.maps.Marker({
          position: loc,
          map: map,
        });

        const iwContent = '<div style="padding:5px;">📍 내 위치</div>';
        const iw = new kakao.maps.InfoWindow({
          content: iwContent,
        });
        iw.open(map, myMarker);

        // 3️⃣ 백엔드에서 주변 주차장 요청
        axios
          .get(`http://localhost:8080/api/parkings/nearby?lat=${myPos.lat}&lon=${myPos.lon}`)
          .then((res) => {
            setParkings(res.data);

            res.data.forEach((p) => {
              if (!p.lat || !p.lon) return;
              const pos = new kakao.maps.LatLng(p.lat, p.lon);

              // 마커 생성
              const marker = new kakao.maps.Marker({
                position: pos,
                map: map,
              });

              // 이름 라벨 생성
              const labelContent = `
                <div style="
                  background: rgba(255,255,255,0.9);
                  border: 1px solid #888;
                  border-radius: 4px;
                  padding: 2px 6px;
                  font-size: 12px;
                  font-weight: 600;
                  color: #222;
                  white-space: nowrap;
                ">${p.name}</div>`;

              const customOverlay = new kakao.maps.CustomOverlay({
                position: pos,
                content: labelContent,
                yAnchor: 1.6,
              });

              customOverlay.setMap(map);
            });
          })
          .catch((err) => console.error("주변 주차장 불러오기 실패:", err));
      });
    };

    return () => script.remove();
  }, [myPos]);

  return (
    <div
      id="kmap"
      style={{
        width: "100%",
        height: "700px",
        borderRadius: "8px",
        overflow: "hidden",
      }}
    />
  );
}
