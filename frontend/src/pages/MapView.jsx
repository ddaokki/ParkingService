import React, { useEffect, useState } from "react";
import { getCurrentPosition } from "../utils/getLocation";
import axios from "axios";

export default function MapView() {
    const [map, setMap] = useState(null);
    const [myPos, setMyPos] = useState(null);
    const [parkings, setParkings] = useState([]);

    // 1️⃣ 내 위치 받아오기
    useEffect(() => {
        getCurrentPosition()
            .then(setMyPos)
            .catch((err) => console.error("위치 정보를 가져오지 못했습니다:", err));
    }, []);

    // 2️⃣ VWorld 지도 생성 및 주차장 마커 표시
    useEffect(() => {
        if (!myPos) return;

        // VWorld Map 객체 생성
        const vwmap = new vworld.Map("vmap", {
            basemapType: vworld.BasemapType.GRAPHIC,
        });

        vwmap.setCenter(new vworld.LatLng(myPos.lat, myPos.lon));
        vwmap.setZoom(15);
        setMap(vwmap);

        // 내 위치 마커 표시
        const myMarker = new vworld.Marker(new vworld.LatLng(myPos.lat, myPos.lon));
        vwmap.addMarker(myMarker);

        // 백엔드에서 주변 주차장 데이터 요청
        axios
            .get(`http://localhost:8080/api/parkings/nearby?lat=${myPos.lat}&lon=${myPos.lon}`)
            .then((res) => {
                setParkings(res.data);

                // 주차장 마커 + 이름 표시
                res.data.forEach((p) => {
                    const pos = new vworld.LatLng(p.lat, p.lon);
                    const marker = new vworld.Marker(pos);

                    // 마커 추가
                    vwmap.addMarker(marker);

                    // 이름 라벨 추가 (간단한 텍스트 Overlay)
                    const label = document.createElement("div");
                    label.innerText = p.name;
                    label.style.position = "absolute";
                    label.style.transform = "translate(-50%, -20px)";
                    label.style.whiteSpace = "nowrap";
                    label.style.fontSize = "12px";
                    label.style.fontWeight = "600";
                    label.style.color = "#222";
                    label.style.background = "rgba(255,255,255,0.8)";
                    label.style.padding = "2px 4px";
                    label.style.borderRadius = "4px";

                    // 라벨을 vworld Marker의 position에 매핑
                    vwmap.addOverlay({
                        position: pos,
                        element: label,
                    });
                });
            })
            .catch((err) => console.error("주차장 불러오기 실패:", err));
    }, [myPos]);

    return (
        <div
            id="vmap"
            style={{
                width: "100%",
                height: "700px",
                borderRadius: "8px",
                overflow: "hidden",
            }}
        />
    );
}
