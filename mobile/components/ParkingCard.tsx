import React from "react";
import { View, Text, Pressable } from "react-native";

export default function ParkingCard({
  item,
  isFavorite,
  onToggleFavorite,
  baseFee,
  addFee,
}: {
  item: any;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  baseFee: number | null;
  addFee: number | null;
}) {
  const title = String(
    item?.name ?? item?.PKLT_NM ?? item?.PARKING_NAME ?? "주차장"
  );
  const addr = String(
    item?.address ??
      item?.addr ??
      item?.ADDR ??
      item?.PKLT_ADDR ??
      item?.ROAD_ADDR ??
      item?.location ??
      ""
  );

  const feeText = (v: number | null) => {
    if (v === null) return "-";
    if (v <= 0) return "무료";
    return `${Math.round(v)}원`;
  };

  return (
    <View
      style={{
        backgroundColor: "white",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 16,
        padding: 14,
        marginBottom: 12,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: "700" }} numberOfLines={2}>
            {title}
          </Text>

          {!!addr && (
            <Text style={{ marginTop: 6, color: "#4b5563" }} numberOfLines={2}>
              {addr}
            </Text>
          )}

          <Text style={{ marginTop: 8, color: "#111827" }}>
            기본요금: {feeText(baseFee)} / 추가요금: {feeText(addFee)}
          </Text>
        </View>

        <Pressable
          onPress={onToggleFavorite}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#e5e7eb",
            alignSelf: "flex-start",
            backgroundColor: "white",
          }}
        >
          <Text style={{ fontSize: 14 }}>
            {isFavorite ? "★ 즐겨찾기" : "☆ 즐겨찾기"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
