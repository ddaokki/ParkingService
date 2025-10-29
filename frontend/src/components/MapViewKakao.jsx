/* global kakao */
import React, { useEffect, useRef, useState } from "react";
import { pickLat, pickLon } from "../utils/geo";

export default function MapViewKakao({
  items = [],
  selectedId,
  onMarkerClick,
  myPos,
  onMyPosChange,
}) {
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [ready, setReady] = useState(false);

  // ✅ Kakao SDK 로드
  useEffect(() => {
    const KAKAO_KEY = process.env.REACT_APP_KAKAO_API_KEY;
    if (!KAKAO_KEY) {
      console.error("⚠️ Kakao API key(.env)가 설정되어 있지 않습니다.");
      return;
    }

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

  // ✅ 지도 초기화
  useEffect(() => {
    if (!ready || !myPos) return;

    const mapContainer = document.getElementById("kmap");
    if (!mapContainer) return;

    const map = new kakao.maps.Map(mapContainer, {
      center: new kakao.maps.LatLng(myPos.lat, myPos.lon),
      level: 5,
    });
    mapRef.current = map;

    // ✅ 내 위치 마커 (드래그 가능)
    const myMarker = new kakao.maps.Marker({
      position: new kakao.maps.LatLng(myPos.lat, myPos.lon),
      draggable: true,
      title: "내 위치",
    });

    // 파란색 마커 이미지
    const blueIcon = new kakao.maps.MarkerImage(
      "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png",
      new kakao.maps.Size(28, 40)
    );
    myMarker.setImage(blueIcon);
    myMarker.setMap(map);

    // 🔹 드래그 종료 시 이벤트
    kakao.maps.event.addListener(myMarker, "dragend", function () {
      const pos = myMarker.getPosition();
      const newPos = { lat: pos.getLat(), lon: pos.getLng() };
      onMyPosChange?.(newPos); // 부모로 전달
    });

    return () => {
      mapRef.current = null;
    };
  }, [ready, myPos]);

  // ✅ 주차장 마커 표시
  useEffect(() => {
    if (!ready || !mapRef.current) return;

    const map = mapRef.current;
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

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
