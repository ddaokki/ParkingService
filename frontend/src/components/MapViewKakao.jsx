/* global kakao */
import React, { useEffect, useRef, useState } from "react";
import { pickLat, pickLon } from "../utils/geo";

export default function MapViewKakao({ items = [], selectedId, onMarkerClick }) {
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [ready, setReady] = useState(false);

  // Kakao SDK 스크립트 로드
  useEffect(() => {
    const KAKAO_KEY = process.env.REACT_APP_KAKAO_API_KEY;
    if (!KAKAO_KEY) {
      console.error("⚠️ Kakao API key가 .env에 설정되어 있지 않습니다.");
      return;
    }

    // 이미 로드된 경우
    if (window.kakao && window.kakao.maps) {
      setReady(true);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&autoload=false`;
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      kakao.maps.load(() => setReady(true));
    };

    return () => {
      script.remove();
    };
  }, []);

  // 지도 초기화
  useEffect(() => {
    if (!ready) return;

    // 초기 중심: 서울시청 or 첫 좌표
    const first = items.find((x) => pickLat(x) && pickLon(x));
    const center = new kakao.maps.LatLng(
      first ? pickLat(first) : 37.5665,
      first ? pickLon(first) : 126.9780
    );

    const mapContainer = document.getElementById("kmap");
    if (!mapContainer) return;

    const map = new kakao.maps.Map(mapContainer, {
      center,
      level: 5,
    });

    mapRef.current = map;

    return () => {
      mapRef.current = null;
    };
  }, [ready]);

  // 마커 갱신
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const map = mapRef.current;

    // 기존 마커 제거
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    // 새 마커 추가
    items.forEach((p) => {
      const lat = pickLat(p);
      const lon = pickLon(p);
      if (!lat || !lon) return;

      const isSelected =
        selectedId && (selectedId === (p._id ?? p.code ?? p.PARKING_CODE ?? p.resourceId));

      const iconSrc = isSelected
        ? "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png"
        : "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png";

      const markerImage = new kakao.maps.MarkerImage(iconSrc, new kakao.maps.Size(32, 32));

      const marker = new kakao.maps.Marker({
        map,
        position: new kakao.maps.LatLng(lat, lon),
        title: p?.name ?? p?.PKLT_NM ?? p?.PARKING_NAME ?? "주차장",
        image: markerImage,
      });

      kakao.maps.event.addListener(marker, "click", () => onMarkerClick?.(p));

      markersRef.current.push(marker);
    });
  }, [items, selectedId, ready, onMarkerClick]);

  return (
    <div className="w-full h-80 md:h-[420px] rounded-lg border overflow-hidden">
      {!ready && (
        <div className="w-full h-full flex items-center justify-center text-sm text-gray-500">
          Kakao 지도 로딩 중이거나 API 키(.env)가 필요합니다.
        </div>
      )}
      <div id="kmap" className="w-full h-full" />
    </div>
  );
}
