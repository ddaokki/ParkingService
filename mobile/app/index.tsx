// app/(tabs)/index.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Alert,
  Switch,
  Pressable,
  StyleSheet,
} from "react-native";
import {
  getAllParkings,
  getFavoritesByUser,
  addFavorite,
  removeFavorite,
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import KakaoMap from "../components/KakaoMap";
import ParkingCard from "../components/ParkingCard";
import { getDistance, getValidLatLon } from "../utils/geo";
import { getMyLocation } from "../utils/getLocation";
import {
  getPid,
  getName,
  getBaseFee,
  getAddFee,
  getPayType,
  hasEv,
} from "../utils/parking";

type SortOption = "distance" | "baseFee" | "addFee";

export default function ParkingList() {
  const { user } = useAuth();

  const [parkings, setParkings] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const [myPos, setMyPos] = useState<{ lat: number; lon: number } | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ 기본=거리 가까운순
  const [sortOption, setSortOption] = useState<SortOption>("distance");

  // ✅ 무료/유료/전체
  const [payFilter, setPayFilter] = useState<"all" | "free" | "paid">("all");

  // ✅ 전기차 충전 가능만
  const [evOnly, setEvOnly] = useState(false);

  // ✅ “정렬은 1km 이내에서만”을 강제하기 위한 상수
  const RADIUS_FOR_SORT = 1000;

  // 1) 내 위치
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const loc = await getMyLocation();
        if (alive && loc) setMyPos(loc);
      } catch (e) {}
    })();
    return () => {
      alive = false;
    };
  }, []);

  // 2) 주차장 + 즐겨찾기
  const refetchFavorites = async (uid: string) => {
    const fav = await getFavoritesByUser(uid);
    // 백엔드 응답 형태가 {favorites: []} 또는 [] 등일 수 있어 방어
    const list = fav.data?.favorites ?? fav.data ?? [];
    setFavorites(Array.isArray(list) ? list : []);
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await getAllParkings();
        if (!alive) return;
        setParkings(Array.isArray(res.data) ? res.data : []);

        if (user?._id) {
          try {
            await refetchFavorites(user._id);
          } catch (e) {
            setFavorites([]);
          }
        } else {
          setFavorites([]);
        }
      } catch (e) {
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [user?._id]);

  // 즐겨찾기 집합
  const favIds = useMemo(
    () => new Set(favorites.map((f) => String(f.resourceId))),
    [favorites]
  );

  // 검색
  const searched = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return parkings;
    return parkings.filter((p) => getName(p).toLowerCase().includes(q));
  }, [parkings, search]);

  // 무료/유료 필터
  const payFiltered = useMemo(() => {
    if (payFilter === "all") return searched;
    return searched.filter((p) => getPayType(p) === payFilter);
  }, [searched, payFilter]);

  // EV 필터
  const evFiltered = useMemo(() => {
    if (!evOnly) return payFiltered;
    return payFiltered.filter((p) => hasEv(p));
  }, [payFiltered, evOnly]);

  /**
   * ✅ 정렬/상단10개 로직 핵심
   * - 거리/요금 정렬은 “내 위치 기반 1km 이내”만 대상으로 함 (요구사항)
   * - 1km 내 데이터가 너무 적거나 위치가 없으면 fallback
   */
  const poolForSort = useMemo(() => {
    if (!myPos) return evFiltered;
    return evFiltered.filter((p) => {
      const pos = getValidLatLon(p);
      if (!pos) return false;
      const d = getDistance(myPos.lat, myPos.lon, pos.lat, pos.lon);
      return d <= RADIUS_FOR_SORT;
    });
  }, [evFiltered, myPos]);

  const sorted = useMemo(() => {
    const base = myPos ? poolForSort : evFiltered;

    // 거리순(기본)
    if (sortOption === "distance") {
      if (!myPos) return base;
      return [...base].sort((a, b) => {
        const A = getValidLatLon(a);
        const B = getValidLatLon(b);
        if (!A || !B) return 0;
        const d1 = getDistance(myPos.lat, myPos.lon, A.lat, A.lon);
        const d2 = getDistance(myPos.lat, myPos.lon, B.lat, B.lon);
        return d1 - d2;
      });
    }

    // 기본요금 낮은순
    if (sortOption === "baseFee") {
      return [...base].sort((a, b) => {
        const fa = getBaseFee(a);
        const fb = getBaseFee(b);
        if (fa === null && fb === null) return 0;
        if (fa === null) return 1;
        if (fb === null) return -1;
        return fa - fb;
      });
    }

    // 추가요금 낮은순
    return [...base].sort((a, b) => {
      const fa = getAddFee(a);
      const fb = getAddFee(b);
      if (fa === null && fb === null) return 0;
      if (fa === null) return 1;
      if (fb === null) return -1;
      return fa - fb;
    });
  }, [evFiltered, myPos, poolForSort, sortOption]);

  // ✅ 상단 10개만 표시
  const top10 = useMemo(() => sorted.slice(0, 10), [sorted]);

  // 지도 마커도 top10 기준
  const mapMarkers = useMemo(() => {
    return top10
      .map((p) => {
        const pos = getValidLatLon(p);
        if (!pos) return null;
        return { id: getPid(p), title: getName(p), lat: pos.lat, lon: pos.lon };
      })
      .filter(Boolean) as {
      id: string;
      title: string;
      lat: number;
      lon: number;
    }[];
  }, [top10]);

  // 즐겨찾기 토글(✅ 400 "이미 추가"면 재동기화 + 안내)
  const toggleFavorite = async (item: any) => {
    if (!user?._id) {
      Alert.alert("안내", "로그인이 필요합니다.");
      return;
    }

    const pid = getPid(item);
    const isFav = favIds.has(pid);

    try {
      if (isFav) {
        // favorites에서 favorite 문서(_id)를 찾아 삭제
        const doc = favorites.find((f) => String(f.resourceId) === pid);
        if (!doc?._id) {
          // 로컬 상태가 꼬였을 가능성 → 재조회
          await refetchFavorites(user._id);
          Alert.alert(
            "안내",
            "즐겨찾기 정보를 다시 불러왔습니다. 다시 시도하십시오."
          );
          return;
        }
        await removeFavorite({ favoriteId: doc._id, userId: user._id });
        await refetchFavorites(user._id);
        Alert.alert("완료", "즐겨찾기를 해제했습니다.");
      } else {
        await addFavorite({
          userId: user._id,
          resourceId: pid,
          resourceType: "parking",
        });
        await refetchFavorites(user._id);
        Alert.alert("완료", "즐겨찾기에 추가했습니다.");
      }
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ?? e?.message ?? "요청에 실패했습니다.";
      if (String(msg).includes("이미 즐겨찾기")) {
        // 서버에는 이미 들어간 상태 → 다시 동기화 후 사용자에게는 “이미 되어있음” 안내
        await refetchFavorites(user._id);
        Alert.alert("안내", "이미 즐겨찾기에 추가된 항목입니다.");
        return;
      }
      if (e?.response?.status === 401) {
        Alert.alert("오류", "즐겨찾기 요청이 실패했습니다. (토큰/권한 확인)");
        return;
      }
      Alert.alert("오류", msg);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={{ paddingBottom: 24 }}
    >
      <KakaoMap
        height={220}
        center={myPos ? { lat: myPos.lat, lon: myPos.lon } : null}
        myPos={myPos}
        markers={mapMarkers}
      />

      <View style={{ height: 12 }} />

      <TextInput
        style={styles.search}
        placeholder="주차장 이름/주소 검색"
        value={search}
        onChangeText={setSearch}
      />

      {/* 정렬 */}
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>정렬</Text>
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          <Chip
            active={sortOption === "distance"}
            onPress={() => setSortOption("distance")}
            label="거리 가까운순"
          />
          <Chip
            active={sortOption === "baseFee"}
            onPress={() => setSortOption("baseFee")}
            label="기본요금 낮은순"
          />
          <Chip
            active={sortOption === "addFee"}
            onPress={() => setSortOption("addFee")}
            label="추가요금 낮은순"
          />
        </View>

        <View style={{ height: 12 }} />

        {/* 유무료 */}
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          <Chip
            active={payFilter === "all"}
            onPress={() => setPayFilter("all")}
            label="전체"
          />
          <Chip
            active={payFilter === "free"}
            onPress={() => setPayFilter("free")}
            label="무료"
          />
          <Chip
            active={payFilter === "paid"}
            onPress={() => setPayFilter("paid")}
            label="유료"
          />
        </View>

        <View style={{ height: 12 }} />

        {/* EV 필터 */}
        <View style={styles.row}>
          <Text style={styles.rowLabel}>전기차 충전 가능 주차장만</Text>
          <Switch value={evOnly} onValueChange={setEvOnly} />
        </View>

        <Text style={styles.hint}>
          표시: 상단 10개 (정렬 대상은 내 위치 기준 1km 이내 우선)
        </Text>
      </View>

      {/* 카드 10개만 */}
      {top10.map((item, idx) => {
        const pid = getPid(item);
        return (
          <ParkingCard
            key={pid || String(idx)}
            item={item}
            isFavorite={favIds.has(pid)}
            onToggleFavorite={() => toggleFavorite(item)}
          />
        );
      })}

      {/* 1km 내 대상이 0개면 안내 */}
      {myPos && sorted.length === 0 && (
        <View style={{ padding: 16 }}>
          <Text style={{ color: "#6b7280" }}>
            현재 위치 1km 이내 조건에서 결과가 없습니다.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

function Chip({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        {
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: active ? "#2563eb" : "#e5e7eb",
          backgroundColor: active ? "#2563eb" : "#f3f4f6",
        },
      ]}
    >
      <Text style={{ fontWeight: "800", color: active ? "white" : "#111827" }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, padding: 16, backgroundColor: "#f8fafc" },
  search: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#fff",
    marginBottom: 12,
  },
  panel: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowLabel: { fontSize: 14, fontWeight: "800", color: "#111827" },
  hint: { marginTop: 10, fontSize: 12, color: "#6b7280", fontWeight: "700" },
});
