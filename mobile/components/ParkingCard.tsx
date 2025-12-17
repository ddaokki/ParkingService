import React from "react";
import { View, Text, Pressable } from "react-native";

type Props = {
  item: any;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onPressDetail: () => void;
};

export default function ParkingCard({
  item,
  isFavorite,
  onToggleFavorite,
  onPressDetail,
}: Props) {
  const title = item?.name ?? item?.PKLT_NM ?? item?.PARKING_NAME ?? "주차장";
  const addr =
    item?.addr ??
    item?.address ??
    item?.ADDR ??
    item?.PKLT_ADDR ??
    item?.PARKING_ADDR ??
    "";

  const baseFee =
    item?.baseFee ??
    item?.BASIC_CHARGE ??
    item?.PKLT_BSC_CHRG ??
    item?.basicFee;
  const addFee =
    item?.addFee ?? item?.ADD_CHARGE ?? item?.PKLT_ADD_CHRG ?? item?.addFee;

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
        backgroundColor: "white",
      }}
    >
      {/* 제목 + 즐겨찾기 */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: "700", flex: 1 }}>
          {title}
        </Text>

        <Pressable
          hitSlop={12}
          onPress={onToggleFavorite}
          style={{
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderWidth: 1,
            borderColor: "#e5e7eb",
            borderRadius: 10,
          }}
        >
          <Text style={{ fontSize: 12 }}>
            {isFavorite ? "★ 즐겨찾기" : "☆ 즐겨찾기"}
          </Text>
        </Pressable>
      </View>

      {/* 주소 */}
      {!!addr && (
        <Text style={{ marginTop: 8, color: "#374151", fontSize: 13 }}>
          {addr}
        </Text>
      )}

      {/* 요금 */}
      <Text style={{ marginTop: 6, color: "#6b7280", fontSize: 12 }}>
        {baseFee != null ? `기본요금: ${baseFee}` : "기본요금: -"}{" "}
        {addFee != null ? `/ 추가요금: ${addFee}` : ""}
      </Text>

      {/* 상세보기 */}
      <Pressable
        onPress={onPressDetail}
        hitSlop={12}
        style={{
          marginTop: 10,
          alignSelf: "flex-start",
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderWidth: 1,
          borderColor: "#e5e7eb",
          borderRadius: 10,
        }}
      >
        <Text style={{ fontSize: 12 }}>상세보기 →</Text>
      </Pressable>
    </View>
  );
}
