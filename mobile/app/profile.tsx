// profile.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  Pressable,
  StyleSheet,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { getFavoritesByUser } from "../services/api";

export default function Profile() {
  const { user, logout } = useAuth();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?._id) return;

    (async () => {
      try {
        const res = await getFavoritesByUser(user._id);
        setFavorites(res.data?.favorites || []);
      } catch (e) {
        console.log("[Profile favorites error]", e);
        setFavorites([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?._id]);

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>로그인이 필요합니다.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{user.username} 님</Text>
        </View>

        <Pressable onPress={logout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>로그아웃</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>즐겨찾기 목록</Text>

      {loading ? (
        <View style={styles.centerPad}>
          <ActivityIndicator />
          <Text style={styles.mutedSmall}>불러오는 중입니다.</Text>
        </View>
      ) : favorites.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.muted}>즐겨찾기가 없습니다.</Text>
          <Text style={styles.mutedSmall}>
            주차장에서 ☆을 눌러 추가하십시오.
          </Text>
        </View>
      ) : (
        favorites.map((fav: any) => {
          const title = String(
            fav.resourceName ?? fav.title ?? fav.resourceId ?? "즐겨찾기"
          );
          const sub = String(fav.resourceType ?? "unknown");
          return (
            <View key={String(fav._id ?? fav.resourceId)} style={styles.card}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {title}
              </Text>
              <Text style={styles.cardSub}>{sub}</Text>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: "#f8fafc" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    padding: 14,
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  title: { fontSize: 22, fontWeight: "800", color: "#0f172a" },
  sub: { marginTop: 4, fontSize: 14, color: "#334155" },
  logoutBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#2563eb",
  },
  logoutText: { color: "white", fontWeight: "700" },

  sectionTitle: {
    marginTop: 6,
    marginBottom: 10,
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
  },

  card: {
    padding: 14,
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 10,
  },
  cardTitle: { fontSize: 15, fontWeight: "800", color: "#0f172a" },
  cardSub: { marginTop: 6, fontSize: 12, color: "#64748b" },

  emptyBox: {
    padding: 16,
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  muted: { color: "#64748b" },
  mutedSmall: { marginTop: 6, fontSize: 12, color: "#94a3b8" },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  centerPad: { alignItems: "center", paddingVertical: 16 },
});
