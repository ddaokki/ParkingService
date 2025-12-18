import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Alert,
  Pressable,
  Modal,
} from "react-native";

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
import KakaoMap from "../components/KakaoMap";

type SortOption = "distance" | "baseFee" | "addFee";
type FeeFilter = "all" | "free" | "paid";

function toNumberLike(v: any): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const s = String(v).replace(/,/g, "");
  const m = s.match(/-?\d+(\.\d+)?/);
  if (!m) return null;
  const n = Number(m[0]);
  return Number.isFinite(n) ? n : null;
}

function pickFirstNumber(obj: any, keys: string[]): number | null {
  for (const k of keys) {
    const n = toNumberLike(obj?.[k]);
    if (n !== null) return n;
  }
  return null;
}

// ✅ 기본요금/추가요금 추출(필드명이 달라도 최대한 잡아주기)
function getFees(p: any): { baseFee: number | null; addFee: number | null } {
  const baseFee = pickFirstNumber(p, [
    "baseFee",
    "basicFee",
    "basic_fee",
    "BASIC_FEE",
    "BAS_FEE",
    "BAS_CHARGE",
    "BASIC_CHARGE",
    "PKLT_BASE_FEE",
    "PKLT_BAS_FEE",
    "PARKING_BASE_FEE",
    "DEFAULT_FEE",
    "기본요금",
    "basicCharge",
  ]);

  const addFee = pickFirstNumber(p, [
    "addFee",
    "extraFee",
    "additionalFee",
    "add_fee",
    "ADD_FEE",
    "EXTRA_FEE",
    "ADD_CHARGE",
    "ADDITIONAL_CHARGE",
    "PKLT_ADD_FEE",
    "PKLT_EXTRA_FEE",
    "PARKING_ADD_FEE",
    "추가요금",
  ]);

  return { baseFee, addFee };
}

// ✅ 무료/유료 판단(기본요금이 0이면 무료로 처리)
function isFreeParking(p: any): boolean {
  const { baseFee } = getFees(p);
  if (baseFee === null) return false;
  return baseFee <= 0;
}

// ✅ 전기차 충전 가능 판단(필드명/값 케이스 다양하게)
function isEvCapable(p: any): boolean {
  const candidates = [
    p?.evAvailable,
    p?.EV_AVAILABLE,
    p?.EV_CHARGE_AVAILABLE,
    p?.EV_CHARGER_YN,
    p?.CHARGER_YN,
    p?.EV_YN,
    p?.isEv,
    p?.hasEv,
    p?.ev,
    p?.chargeable,
    p?.EV_CNT,
    p?.chargerCount,
  ];

  for (const v of candidates) {
    if (v === true) return true;
    if (typeof v === "number" && v > 0) return true;
    const s = String(v ?? "")
      .trim()
      .toLowerCase();
    if (s === "y" || s === "yes" || s === "true" || s === "1") return true;
  }
  return false;
}

// ✅ 간단 드롭다운(Modal) 컴포넌트
function SelectModal<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { label: string; value: T }[];
  onChange: (v: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const currentLabel = options.find((o) => o.value === value)?.label ?? "";

  return (
    <>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Text style={{ fontSize: 14 }}>{label}</Text>
        <Pressable
          onPress={() => setOpen(true)}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#e5e7eb",
            backgroundColor: "white",
            minWidth: 160,
          }}
        >
          <Text style={{ fontSize: 14 }}>{currentLabel} ▾</Text>
        </Pressable>
      </View>

      <Modal visible={open} transparent animationType="fade">
        <Pressable
          onPress={() => setOpen(false)}
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.35)",
            padding: 16,
            justifyContent: "center",
          }}
        >
          <Pressable
            onPress={() => {}}
            style={{
              backgroundColor: "white",
              borderRadius: 14,
              paddingVertical: 10,
              overflow: "hidden",
            }}
          >
            {options.map((o) => {
              const active = o.value === value;
              return (
                <Pressable
                  key={o.value}
                  onPress={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  style={{
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    backgroundColor: active ? "#3b82f6" : "white",
                  }}
                >
                  <Text
                    style={{ color: active ? "white" : "black", fontSize: 15 }}
                  >
                    {o.label}
                  </Text>
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

export default function ParkingList() {
  const { user } = useAuth();

  const [parkings, setParkings] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const [myPos, setMyPos] = useState<{ lat: number; lon: number } | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ 기본 정렬 = 거리 가까운 순
  const [sortOption, setSortOption] = useState<SortOption>("distance");

  // ✅ 요금 필터: 전체/무료/유료
  const [feeFilter, setFeeFilter] = useState<FeeFilter>("all");

  // ✅ 전기차 충전 가능 필터
  const [onlyEv, setOnlyEv] = useState(false);

  const RADIUS = 1000;
  const [radiusFilter, setRadiusFilter] = useState(false);

  const getPid = (p: any) =>
    String(
      p?._id ??
        p?.id ??
        p?.code ??
        p?.PKLT_CD ??
        p?.PARKING_CODE ??
        p?.resourceId
    );

  // 위치(실패해도 앱 동작)
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

  // 데이터 로딩
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

  const favIds = useMemo(
    () => new Set(favorites.map((f) => String(f.resourceId))),
    [favorites]
  );

  // 검색
  const filteredBySearch = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return parkings;

    return parkings.filter((p) =>
      String(p?.name ?? p?.PKLT_NM ?? p?.PARKING_NAME ?? "")
        .toLowerCase()
        .includes(q)
    );
  }, [parkings, search]);

  // 요금(무료/유료) 필터
  const filteredByFee = useMemo(() => {
    if (feeFilter === "all") return filteredBySearch;
    if (feeFilter === "free")
      return filteredBySearch.filter((p) => isFreeParking(p));
    return filteredBySearch.filter((p) => !isFreeParking(p));
  }, [filteredBySearch, feeFilter]);

  // EV 필터
  const filteredByEv = useMemo(() => {
    if (!onlyEv) return filteredByFee;
    return filteredByFee.filter((p) => isEvCapable(p));
  }, [filteredByFee, onlyEv]);

  // 반경 필터(1km)
  const radiusFiltered = useMemo(() => {
    if (!radiusFilter || !myPos) return filteredByEv;

    return filteredByEv.filter((p) => {
      const pos = getValidLatLon(p);
      if (!pos) return false;
      const d = getDistance(myPos.lat, myPos.lon, pos.lat, pos.lon);
      return d <= RADIUS;
    });
  }, [filteredByEv, radiusFilter, myPos]);

  // 정렬
  const sorted = useMemo(() => {
    const list = radiusFiltered;

    if (sortOption === "distance") {
      if (!myPos) return list; // 위치 없으면 정렬 불가 → 원본 유지
      return [...list].sort((a, b) => {
        const A = getValidLatLon(a);
        const B = getValidLatLon(b);
        if (!A || !B) return 0;
        const d1 = getDistance(myPos.lat, myPos.lon, A.lat, A.lon);
        const d2 = getDistance(myPos.lat, myPos.lon, B.lat, B.lon);
        return d1 - d2;
      });
    }

    if (sortOption === "baseFee") {
      return [...list].sort((a, b) => {
        const fa = getFees(a).baseFee ?? Number.POSITIVE_INFINITY;
        const fb = getFees(b).baseFee ?? Number.POSITIVE_INFINITY;
        return fa - fb;
      });
    }

    // addFee
    return [...list].sort((a, b) => {
      const fa = getFees(a).addFee ?? Number.POSITIVE_INFINITY;
      const fb = getFees(b).addFee ?? Number.POSITIVE_INFINITY;
      return fa - fb;
    });
  }, [radiusFiltered, sortOption, myPos]);

  // ✅ 상단 10개만 (탭/필터/정렬 결과에서)
  const top10 = useMemo(() => sorted.slice(0, 10), [sorted]);

  // 지도 마커(top10 기준)
  const mapMarkers = useMemo(() => {
    return top10
      .map((p) => {
        const pos = getValidLatLon(p);
        if (!pos) return null;

        const pid = getPid(p);
        const title = String(
          p?.name ?? p?.PKLT_NM ?? p?.PARKING_NAME ?? "주차장"
        );
        return { id: pid, title, lat: pos.lat, lon: pos.lon };
      })
      .filter(Boolean) as {
      id: string;
      title: string;
      lat: number;
      lon: number;
    }[];
  }, [top10]);

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

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={{ padding: 16 }}>
      <KakaoMap
        height={260}
        center={myPos ? { lat: myPos.lat, lon: myPos.lon } : null}
        markers={mapMarkers}
      />

      <View style={{ height: 12 }} />

      {/* 검색창 */}
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: "#e5e7eb",
          paddingHorizontal: 14,
          paddingVertical: 12,
          borderRadius: 12,
          marginBottom: 12,
          backgroundColor: "white",
        }}
        placeholder="주차장 검색"
        value={search}
        onChangeText={setSearch}
      />

      {/* 정렬 + 요금구분 드롭다운 */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          gap: 10,
          marginBottom: 10,
        }}
      >
        <SelectModal<SortOption>
          label="정렬:"
          value={sortOption}
          options={[
            { label: "기본요금 낮은순", value: "baseFee" },
            { label: "거리 가까운순", value: "distance" },
            { label: "추가요금 낮은순", value: "addFee" },
          ]}
          onChange={(v) => {
            if (v === "distance" && !myPos) {
              Alert.alert(
                "안내",
                "현재 위치를 가져오지 못해 거리순 정렬을 사용할 수 없습니다."
              );
              return;
            }
            setSortOption(v);
          }}
        />

        <SelectModal<FeeFilter>
          label="요금 구분:"
          value={feeFilter}
          options={[
            { label: "전체", value: "all" },
            { label: "무료", value: "free" },
            { label: "유료", value: "paid" },
          ]}
          onChange={setFeeFilter}
        />
      </View>

      {/* 체크 필터: EV / 1km */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
          flexWrap: "wrap",
        }}
      >
        <Pressable
          onPress={() => setOnlyEv((v) => !v)}
          style={{
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 12,
            backgroundColor: onlyEv ? "#3b82f6" : "#e5e7eb",
          }}
        >
          <Text style={{ color: onlyEv ? "white" : "black" }}>
            전기차 충전 가능 주차장만
          </Text>
        </Pressable>

        <Pressable
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
          }}
        >
          <Text style={{ color: radiusFilter ? "white" : "black" }}>
            1km 이내
          </Text>
        </Pressable>
      </View>

      {/* ✅ 리스트(카드형) - top10만 */}
      {top10.map((item, idx) => {
        const pid = getPid(item);
        const fees = getFees(item);

        return (
          <ParkingCard
            key={pid || String(idx)}
            item={item}
            isFavorite={favIds.has(pid)}
            onToggleFavorite={() => toggleFavorite(item)}
            baseFee={fees.baseFee}
            addFee={fees.addFee}
          />
        );
      })}
    </ScrollView>
  );
}
