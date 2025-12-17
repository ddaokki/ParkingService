import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";

import {
  getAllParkings,
  getFavoritesByUser,
  addFavorite,
  removeFavorite,
} from "../services/api";

import ParkingCard from "../components/ParkingCard";
import { useAuth } from "../context/AuthContext";

import { getDistance, getValidLatLon } from "../utils/geo";
import { getMyLocation } from "../utils/getLocation";

export default function ParkingList() {
  const router = useRouter();
  const { user } = useAuth();

  const [parkings, setParkings] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const [myPos, setMyPos] = useState<{ lat: number; lon: number } | null>(null);
  const [loading, setLoading] = useState(true);

  // 정렬
  const [sortOption, setSortOption] = useState<"none" | "distance">("none");

  // 반경 1km 필터
  const [radiusFilter, setRadiusFilter] = useState(false);
  const RADIUS = 1000;

  // ✅ 주차장 id 통일 (즐겨찾기/상세보기 공통으로 사용)
  const getPid = (p: any) =>
    String(
      p?._id ??
        p?.id ??
        p?.code ??
        p?.PKLT_CD ??
        p?.PARKING_CODE ??
        p?.resourceId
    );

  // 위치는 실패해도 앱 동작은 하게
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const loc = await getMyLocation();
        if (alive && loc) setMyPos(loc);
      } catch (e) {
        console.log("[getMyLocation error]", e);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // 주차장 + 즐겨찾기
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);

        const res = await getAllParkings();
        if (!alive) return;
        setParkings(Array.isArray(res.data) ? res.data : []);

        if (user?._id) {
          // favorites는 실패해도 전체를 실패 처리하지 않음
          try {
            const fav = await getFavoritesByUser(user._id);
            if (!alive) return;
            setFavorites(fav.data?.favorites || []);
          } catch (e) {
            console.log("[Favorites] fetch failed:", e);
            if (!alive) return;
            setFavorites([]);
          }
        } else {
          setFavorites([]);
        }
      } catch (e) {
        console.log("[INIT error]", e);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [user?._id]);

  // 즐겨찾기 id 집합(문자열 기준으로 통일)
  const favIds = useMemo(() => {
    return new Set(favorites.map((f) => String(f.resourceId)));
  }, [favorites]);

  // 검색
  const filtered = useMemo(() => {
    return parkings.filter((p) =>
      String(p?.name ?? p?.PKLT_NM ?? p?.PARKING_NAME ?? "")
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [parkings, search]);

  // 반경 필터
  const radiusFiltered = useMemo(() => {
    if (!radiusFilter || !myPos) return filtered;

    return filtered.filter((p) => {
      const pos = getValidLatLon(p);
      if (!pos) return false;
      const d = getDistance(myPos.lat, myPos.lon, pos.lat, pos.lon);
      return d <= RADIUS;
    });
  }, [filtered, radiusFilter, myPos]);

  // 정렬(거리순)
  const sorted = useMemo(() => {
    if (sortOption !== "distance" || !myPos) return radiusFiltered;

    return [...radiusFiltered].sort((a, b) => {
      const A = getValidLatLon(a);
      const B = getValidLatLon(b);
      if (!A || !B) return 0;
      const d1 = getDistance(myPos.lat, myPos.lon, A.lat, A.lon);
      const d2 = getDistance(myPos.lat, myPos.lon, B.lat, B.lon);
      return d1 - d2;
    });
  }, [radiusFiltered, sortOption, myPos]);

  // 즐겨찾기 토글
  const toggleFavorite = async (item: any) => {
    if (!user?._id) {
      Alert.alert("안내", "로그인이 필요합니다.");
      return;
    }

    const pid = getPid(item);
    const isFav = favIds.has(pid);

    try {
      if (isFav) {
        const doc = favorites.find((f) => String(f.resourceId) === pid);
        if (doc) {
          await removeFavorite({ favoriteId: doc._id, userId: user._id });
          setFavorites((prev) => prev.filter((f) => f._id !== doc._id));
        }
      } else {
        const res = await addFavorite({
          userId: user._id,
          resourceId: pid,
          resourceType: "parking",
        });
        setFavorites((prev) => [...prev, res.data]);
      }
    } catch (e) {
      console.log("[toggleFavorite error]", e);
    }
  };

  // 상세보기 이동(✅ expo-router 정석)
  const goDetail = (item: any) => {
    const pid = getPid(item);
    router.push({ pathname: "/parking/[id]", params: { id: pid } });
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={{ padding: 16 }}>
      {/* 검색창 */}
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: "#e5e7eb",
          paddingHorizontal: 14,
          paddingVertical: 12,
          borderRadius: 12,
          marginBottom: 12,
        }}
        placeholder="주차장 검색"
        value={search}
        onChangeText={setSearch}
      />

      {/* 정렬/필터 */}
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
        <Text
          onPress={() => setSortOption("none")}
          style={{
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 12,
            backgroundColor: sortOption === "none" ? "#3b82f6" : "#e5e7eb",
            color: sortOption === "none" ? "white" : "black",
            overflow: "hidden",
          }}
        >
          기본순
        </Text>

        <Text
          onPress={() => {
            if (!myPos) {
              Alert.alert(
                "안내",
                "현재 위치를 가져오지 못해 거리순 정렬을 사용할 수 없습니다."
              );
              return;
            }
            setSortOption("distance");
          }}
          style={{
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 12,
            backgroundColor: sortOption === "distance" ? "#3b82f6" : "#e5e7eb",
            color: sortOption === "distance" ? "white" : "black",
            overflow: "hidden",
          }}
        >
          거리순
        </Text>

        <Text
          onPress={() => {
            if (!myPos) {
              Alert.alert(
                "안내",
                "현재 위치를 가져오지 못해 1km 필터를 사용할 수 없습니다."
              );
              return;
            }
            setRadiusFilter((v) => !v);
          }}
          style={{
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 12,
            backgroundColor: radiusFilter ? "#3b82f6" : "#e5e7eb",
            color: radiusFilter ? "white" : "black",
            overflow: "hidden",
          }}
        >
          1km 이내
        </Text>
      </View>

      {/* 리스트(카드형) */}
      {sorted.map((item, idx) => {
        const pid = getPid(item);
        return (
          <ParkingCard
            key={pid || String(idx)}
            item={item}
            isFavorite={favIds.has(pid)}
            onToggleFavorite={() => toggleFavorite(item)}
            onPressDetail={() => goDetail(item)}
          />
        );
      })}
    </ScrollView>
  );
}
