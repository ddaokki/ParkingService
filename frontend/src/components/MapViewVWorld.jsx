// frontend/src/components/MapViewVWorld.jsx
import React, { useEffect, useRef, useState } from "react";
import { loadVWorld } from "../utils/vworld";
import { pickLat, pickLon } from "../utils/geo";

export default function MapViewVWorld({ items = [], selectedId, onMarkerClick }) {
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const [ready, setReady] = useState(false);

  // 스크립트 로드
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ok = await loadVWorld();
      if (!cancelled) setReady(ok);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // 지도 초기화
  useEffect(() => {
    if (!ready) return;
    const vw = window.vw || window.vworld;
    if (!vw?.ol3?.Map) return; // 버전/환경 이슈면 지도 생략(상단 메시지로 안내)

    // 컨테이너 초기화
    const el = document.getElementById("vmap");
    if (!el) return;
    el.innerHTML = "";

    // 초기 중심(서울 시청) 또는 첫 좌표
    const first = items.find((x) => pickLat(x) && pickLon(x));
    const center = first
      ? { x: pickLon(first), y: pickLat(first), epsg: "EPSG:4326", z: 12 }
      : { x: 126.9784, y: 37.5667, epsg: "EPSG:4326", z: 11 };

    const map = new vw.ol3.Map("vmap", {
      basemapType: vw.ol3.BasemapType.GRAYSCALE,
      controlDensity: vw.ol3.DensityType.BASIC,
      interactionDensity: vw.ol3.DensityType.BASIC,
      controlsAutoArrange: true,
      initPosition: center,
    });
    mapRef.current = map;

    const layer = new vw.ol3.layer.Marker("PARKING_MARKERS");
    map.addLayer(layer);
    layerRef.current = layer;

    return () => {
      try {
        map.removeLayer(layer);
      } catch {}
      mapRef.current = null;
      layerRef.current = null;
    };
  }, [ready]);

  // 마커 갱신
  useEffect(() => {
    const vw = window.vw || window.vworld;
    if (!ready || !vw?.ol3 || !layerRef.current) return;

    const layer = layerRef.current;
    // 레이어 비우기
    try {
      layer.clear(); // 지원되지 않으면 try/catch 넘어감
    } catch {
      // clear 미지원일 경우 수동 제거
      if (layer.markers) {
        layer.markers.forEach((m) => layer.removeMarker?.(m));
      }
    }

    items.forEach((p) => {
      const lat = pickLat(p);
      const lon = pickLon(p);
      if (!lat || !lon) return;

      const isSelected = selectedId && (selectedId === (p._id ?? p.code ?? p.PARKING_CODE ?? p.resourceId));
      const marker = new vw.ol3.marker({
        x: lon,
        y: lat,
        epsg: "EPSG:4326",
        title: p?.name ?? p?.PKLT_NM ?? p?.PARKING_NAME ?? "주차장",
        icon: isSelected
          ? "https://map.vworld.kr/images/ol3/marker_blue.png"
          : "https://map.vworld.kr/images/ol3/marker.png",
      });
      marker.set?.("data", p);
      layer.addMarker(marker);
      marker.on?.("click", () => onMarkerClick?.(p));
    });
  }, [items, selectedId, ready, onMarkerClick]);

  return (
    <div className="w-full h-80 md:h-[420px] rounded-lg border overflow-hidden">
      {!ready && (
        <div className="w-full h-full flex items-center justify-center text-sm text-gray-500">
          V-World 지도 로딩 중이거나 API 키(.env)가 필요합니다.
        </div>
      )}
      <div id="vmap" className="w-full h-full" />
    </div>
  );
}
