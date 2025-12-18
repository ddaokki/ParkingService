// components/ParkingCard.tsx
import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import {
  getAddr,
  getAddFee,
  getBaseFee,
  getName,
  getPayType,
} from "../utils/parking";

export default function ParkingCard({
  item,
  isFavorite,
  onToggleFavorite,
}: {
  item: any;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}) {
  const name = getName(item);
  const addr = getAddr(item);
  const base = getBaseFee(item);
  const add = getAddFee(item);
  const pay = getPayType(item);

  return (
    <View style={styles.card}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={styles.title} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.addr} numberOfLines={2}>
          {addr || "-"}
        </Text>

        <Text style={styles.fee}>
          기본요금: {base === null ? "-" : `${base}원`} / 추가요금:{" "}
          {add === null ? "-" : `${add}원`}
        </Text>

        <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
          <View
            style={[styles.badge, pay === "free" ? styles.free : styles.paid]}
          >
            <Text style={styles.badgeText}>
              {pay === "free" ? "무료" : pay === "paid" ? "유료" : "정보없음"}
            </Text>
          </View>
        </View>
      </View>

      <Pressable
        onPress={onToggleFavorite}
        style={[styles.favBtn, isFavorite ? styles.favOn : styles.favOff]}
      >
        <Text
          style={[
            styles.favText,
            isFavorite ? styles.favTextOn : styles.favTextOff,
          ]}
        >
          {isFavorite ? "★ 즐겨찾기됨" : "☆ 즐겨찾기"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  title: { fontSize: 18, fontWeight: "800", color: "#111827" },
  addr: { marginTop: 6, fontSize: 13, color: "#4b5563" },
  fee: { marginTop: 10, fontSize: 11, fontWeight: "700", color: "#111827" },

  badge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  free: { backgroundColor: "#ecfeff" },
  paid: { backgroundColor: "#eef2ff" },
  badgeText: { fontSize: 13, fontWeight: "800", color: "#111827" },

  favBtn: {
    minWidth: 120,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  favOn: { backgroundColor: "#fde68a", borderColor: "#f59e0b" }, // 노란색
  favOff: { backgroundColor: "#fff" },

  favText: { fontSize: 13, fontWeight: "900" },
  favTextOn: { color: "#92400e" },
  favTextOff: { color: "#111827" },
});
