import React, { useEffect, useMemo, useState } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { getAllParkings } from "../services/api";
import { getValidLatLon } from "../utils/geo";
import { getMyLocation } from "../utils/getLocation";

export default function MapScreen() {
  const [parkings, setParkings] = useState<any[]>([]);
  const [myPos, setMyPos] = useState<{ lat: number; lon: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  // 위치 없어도 지도 표시(서울 기본)
  const DEFAULT = useMemo(() => ({ lat: 37.5665, lon: 126.978 }), []);

  // 1) 위치는 "별도"로 시도 (실패해도 지도 막지 않음)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const pos = await getMyLocation();
        if (alive && pos) setMyPos(pos);
      } catch (e) {
        console.log("[Map] getMyLocation error:", e);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // 2) 주차장 데이터 로딩
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErrMsg(null);
      try {
        const res = await getAllParkings();
        if (!alive) return;
        setParkings(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        console.log("[Map] getAllParkings error:", e);
        if (!alive) return;
        setErrMsg("주차장 데이터를 불러오지 못했습니다.");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10, fontSize: 12, color: "#666" }}>
          지도 로딩 중...
        </Text>
      </View>
    );
  }

  const center = myPos ?? DEFAULT;

  return (
    <View style={{ flex: 1 }}>
      {errMsg && (
        <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
          <Text style={{ fontSize: 12 }}>{errMsg}</Text>
        </View>
      )}

      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude: center.lat,
          longitude: center.lon,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
      >
        {/* 내 위치(있을 때만) */}
        {myPos && (
          <Marker
            coordinate={{ latitude: myPos.lat, longitude: myPos.lon }}
            title="내 위치"
            pinColor="blue"
          />
        )}

        {/* 주차장 마커 */}
        {parkings.map((p, idx) => {
          const pos = getValidLatLon(p);
          if (!pos) return null;

          return (
            <Marker
              key={String(p?._id ?? p?.id ?? p?.code ?? p?.PKLT_CD ?? idx)}
              coordinate={{ latitude: pos.lat, longitude: pos.lon }}
              title={p?.name ?? p?.PKLT_NM ?? "주차장"}
            />
          );
        })}
      </MapView>
    </View>
  );
}
