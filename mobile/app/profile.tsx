// app/(tabs)/profile.tsx
import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { useAuth } from "../context/AuthContext";
import {
  getFavoritesByUser,
  getAllParkings,
  removeFavorite,
} from "../services/api";
import ParkingCard from "../components/ParkingCard";
import { getPid } from "../utils/parking";

export default function Profile() {
  const { user, logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [parkings, setParkings] = useState<any[]>([]);

  const load = useCallback(async () => {
    if (!user?._id) {
      setFavorites([]);
      setParkings([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // 즐겨찾기 + 전체 주차장(즐겨찾기 카드에 주차장 정보를 매칭하려면 필요)
      const [favRes, pRes] = await Promise.all([
        getFavoritesByUser(user._id),
        getAllParkings(),
      ]);
      const favList = favRes.data?.favorites ?? favRes.data ?? [];
      setFavorites(Array.isArray(favList) ? favList : []);
      setParkings(Array.isArray(pRes.data) ? pRes.data : []);
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ?? e?.message ?? "불러오기에 실패했습니다.";
      Alert.alert("오류", msg);
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  // ✅ 탭 이동/진입 때마다 새로 로딩
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // 즐겨찾기한 주차장 데이터로 조인
  const favoriteParkings = useMemo(() => {
    const ids = new Set(favorites.map((f) => String(f.resourceId)));
    const list = parkings.filter((p) => ids.has(getPid(p)));
    return list;
  }, [favorites, parkings]);

  const favIds = useMemo(
    () => new Set(favorites.map((f) => String(f.resourceId))),
    [favorites]
  );

  const toggleOff = async (item: any) => {
    if (!user?._id) return;
    const pid = getPid(item);
    const doc = favorites.find((f) => String(f.resourceId) === pid);
    if (!doc?._id) {
      await load();
      return;
    }
    try {
      await removeFavorite({ favoriteId: doc._id, userId: user._id });
      Alert.alert("완료", "즐겨찾기를 해제했습니다.");
      await load();
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ?? e?.message ?? "해제에 실패했습니다.";
      Alert.alert("오류", msg);
    }
  };

  if (!user) {
    return (
      <View
        style={[
          styles.page,
          { alignItems: "center", justifyContent: "center" },
        ]}
      >
        <Text style={{ fontSize: 16, fontWeight: "900" }}>
          로그인이 필요합니다.
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View
        style={[
          styles.page,
          { alignItems: "center", justifyContent: "center" },
        ]}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={{ paddingBottom: 24 }}
    >
      <View style={styles.header}>
        <Text style={styles.appTitle}>{user.username} 님</Text>
      </View>

      <Text style={styles.sectionTitle}>즐겨찾기 목록</Text>

      {favoriteParkings.length === 0 ? (
        <View style={{ paddingVertical: 30 }}>
          <Text style={{ color: "#6b7280", fontWeight: "700" }}>
            즐겨찾기한 주차장이 없습니다.
          </Text>
        </View>
      ) : (
        favoriteParkings.map((p) => (
          <ParkingCard
            key={getPid(p)}
            item={p}
            isFavorite={favIds.has(getPid(p))}
            onToggleFavorite={() => toggleOff(p)} // 프로필에서는 “해제”가 핵심
          />
        ))
      )}

      <View style={{ height: 12 }} />
      <Text style={styles.logout} onPress={logout}>
        로그아웃
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, padding: 16, backgroundColor: "#f8fafc" },
  header: { marginBottom: 14 },
  appTitle: { fontSize: 22, fontWeight: "900", color: "#111827" },
  userText: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: "900",
    color: "#111827",
  },
  sectionTitle: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: "900",
    color: "#111827",
  },
  logout: {
    marginTop: 10,
    textAlign: "center",
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#1d4ed8",
    color: "white",
    fontWeight: "900",
  },
});
