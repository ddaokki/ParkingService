import React from "react";
import { View, Text, Pressable } from "react-native";
import { Link } from "expo-router";

export default function ParkingCard({ item, isFavorite, onToggleFavorite }: any) {
    return (
        <View className="border rounded-lg p-4 mb-3 bg-white">
            <View className="flex-row justify-between">
                <Text className="text-lg font-semibold">{item.name}</Text>

                <Text
                    onPress={onToggleFavorite}
                    className="text-xl"
                >
                    {isFavorite ? "★" : "☆"}
                </Text>
            </View>

            <Text className="text-gray-600">{item.address || "주소 정보 없음"}</Text>

            <Link
                href={`./app/parking/${item.resourceId}`}
                className="text-blue-600 mt-2"
            >
                상세 보기 →
            </Link>
        </View>
    );
}
