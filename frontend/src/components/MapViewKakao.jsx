/* global kakao */
import React, { useEffect, useRef, useState } from "react";
import { pickLat, pickLon } from "../utils/geo";

export default function MapViewKakao({
  items = [],
  selectedId,
  onMarkerClick,
  myPos,
  onMyPosChange,
  favorites = [],
}) {
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const myMarkerRef = useRef(null);
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

  // ✅ 지도 초기화 + 내 위치 마커
  useEffect(() => {
    if (!ready || !myPos) return;
    const mapContainer = document.getElementById("kmap");
    if (!mapContainer) return;

    const map = new kakao.maps.Map(mapContainer, {
      center: new kakao.maps.LatLng(myPos.lat, myPos.lon),
      level: 5,
    });
    mapRef.current = map;

    // 🔵 내 위치 마커
    const blueIcon = new kakao.maps.MarkerImage(
      "https://maps.gstatic.com/mapfiles/ms2/micons/blue-dot.png",
      new kakao.maps.Size(32, 32)
    );

    const myMarker = new kakao.maps.Marker({
      position: new kakao.maps.LatLng(myPos.lat, myPos.lon),
      draggable: true,
      title: "내 위치",
      image: blueIcon,
    });

    myMarker.setMap(map);
    myMarkerRef.current = myMarker;

    kakao.maps.event.addListener(myMarker, "dragend", () => {
      const pos = myMarker.getPosition();
      onMyPosChange?.({ lat: pos.getLat(), lon: pos.getLng() });
    });

    return () => {
      mapRef.current = null;
      myMarkerRef.current = null;
    };
  }, [ready, myPos]);

  // ✅ 내 위치 이동 반영
  useEffect(() => {
    if (myMarkerRef.current && myPos) {
      myMarkerRef.current.setPosition(new kakao.maps.LatLng(myPos.lat, myPos.lon));
    }
  }, [myPos]);

  // ✅ 즐겨찾기 ID 집합 (문자열 기준)
  const favSet = new Set(favorites.map((f) => String(f.resourceId)));

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

      const pid = String(
        p._id ?? p.code ?? p.PKLT_CD ?? p.PARKING_CODE ?? p.resourceId
      );

      const isFavorite = favSet.has(pid);
      const isSelected = selectedId === pid;

      let iconSrc = "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png";
      if (isFavorite)
        iconSrc = "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png";
      else if (isSelected)
        iconSrc = "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png";

      const marker = new kakao.maps.Marker({
        map,
        position: new kakao.maps.LatLng(lat, lon),
        title: p?.name ?? p?.PKLT_NM ?? p?.PARKING_NAME ?? "주차장",
        image: new kakao.maps.MarkerImage(iconSrc, new kakao.maps.Size(32, 32)),
      });

      kakao.maps.event.addListener(marker, "click", () => onMarkerClick?.(p));
      markersRef.current.push(marker);
    });
  }, [ready, items, selectedId, favorites]); // favorites 의존성 포함

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
