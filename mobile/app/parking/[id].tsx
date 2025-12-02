import React, { useEffect, useState, useMemo } from "react";
import { View, Text, ActivityIndicator, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";

import {
    getAllParkings,
    getFavoritesByUser,
    addFavorite,
    removeFavorite,
} from "../../services/api";

import { useAuth } from "../../context/AuthContext";
import { getValidLatLon, getDistance } from "../../utils/geo";
import { getMyLocation } from "../../utils/getLocation";

export default function ParkingDetail() {
    const { id } = useLocalSearchParams(); // URL에서 resourceId 가져오기
    const { user } = useAuth();

    const [parking, setParking] = useState<any | null>(null);
    const [isFavorite, setIsFavorite] = useState(false);

    const [myPos, setMyPos] = useState<{ lat: number; lon: number } | null>(null);
    const [loading, setLoading] = useState(true);

    // 🔹 GPS 위치
    useEffect(() => {
        (async () => {
            const loc = await getMyLocation();
            if (loc) setMyPos(loc);
        })();
    }, []);

    // 🔹 주차장 정보 + 즐겨찾기 상태 불러오기
    useEffect(() => {
        (async () => {
            try {
                const res = await getAllParkings();
                const found = res.data.find((p: any) => String(p.resourceId) === String(id));
                setParking(found);

                if (user?._id) {
                    const fav = await getFavoritesByUser(user._id);
                    const ids = fav.data.favorites.map((f: any) => f.resourceId);
                    setIsFavorite(ids.includes(found.resourceId));
                }
            } catch (e) {
                console.log(e);
            } finally {
                setLoading(false);
            }
        })();
    }, [id, user]);

    const toggleFavorite = async () => {
        if (!user?._id || !parking) return;

        if (isFavorite) {
            const favList = await getFavoritesByUser(user._id);
            const doc = favList.data.favorites.find(
                (f: any) => f.resourceId === parking.resourceId
            );
            if (doc) {
                await removeFavorite({ favoriteId: doc._id, userId: user._id });
            }
            setIsFavorite(false);
        } else {
            await addFavorite({
                userId: user._id,
                resourceId: parking.resourceId,
                resourceType: "parking",
            });
            setIsFavorite(true);
        }
    };

    if (loading || !parking)
        return (
            <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" />
            </View>
        );

    const pos = getValidLatLon(parking);
    const distance = myPos && pos
        ? getDistance(myPos.lat, myPos.lon, pos.lat, pos.lon)
        : null;

    return (
        <ScrollView className="p-4">

            <View className="flex-row justify-between items-center">
                <Text className="text-2xl font-bold">{parking.name}</Text>

                <Text
                    onPress={toggleFavorite}
                    className="text-3xl"
                >
                    {isFavorite ? "★" : "☆"}
                </Text>
            </View>

            <Text className="mt-2 text-gray-700">
                주소: {parking.address || "미제공"}
            </Text>

            {distance !== null && (
                <Text className="mt-1 text-gray-700">
                    거리: {(distance / 1000).toFixed(2)} km
                </Text>
            )}

            <View className="mt-4 border-t pt-4">
                <Text className="text-lg font-semibold">요금 정보</Text>
                <Text>기본 요금: {parking.basic_charge || "정보 없음"}</Text>
                <Text>추가 요금: {parking.add_unit_charge || "정보 없음"}</Text>
                <Text>일 최대 요금: {parking.day_max_charge || "정보 없음"}</Text>
            </View>

            <View className="mt-4 border-t pt-4">
                <Text className="text-lg font-semibold">운영 정보</Text>
                <Text>운영 시간: {parking.weekday_oper_open_time || "정보 없음"}</Text>
                <Text>요금 구분: {parking.chrg_se || "정보 없음"}</Text>
            </View>
        </ScrollView>
    );
}
