import React, { useEffect, useState, useMemo } from "react";
import {
    View,
    Text,
    ScrollView,
    ActivityIndicator,
    TextInput,
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

export default function ParkingList() {
    const { user } = useAuth();

    const [parkings, setParkings] = useState<any[]>([]);
    const [favorites, setFavorites] = useState<any[]>([]);
    const [search, setSearch] = useState("");

    const [myPos, setMyPos] = useState<{ lat: number; lon: number } | null>(null);
    const [loading, setLoading] = useState(true);

    // 정렬(거리순)
    const [sortOption, setSortOption] = useState<"none" | "distance">("none");

    // 반경 1km 필터
    const [radiusFilter, setRadiusFilter] = useState(false);
    const RADIUS = 1000; // 1km

    // 🔹 GPS 현재 위치 가져오기
    useEffect(() => {
        (async () => {
            const loc = await getMyLocation();
            if (loc) setMyPos(loc);
        })();
    }, []);

    // 🔹 주차장 + 즐겨찾기 불러오기
    useEffect(() => {
        (async () => {
            try {
                const res = await getAllParkings();
                setParkings(res.data);

                if (user?._id) {
                    const fav = await getFavoritesByUser(user._id);
                    setFavorites(fav.data?.favorites || []);
                }
            } catch (error) {
                console.log(error);
            } finally {
                setLoading(false);
            }
        })();
    }, [user]);

    // 🔹 즐겨찾기 ID 집합
    const favIds = useMemo(
        () => new Set(favorites.map((f) => f.resourceId)),
        [favorites]
    );

    // 🔹 검색 필터
    const filtered = useMemo(() => {
        return parkings.filter((p) =>
            p.name.toLowerCase().includes(search.toLowerCase())
        );
    }, [parkings, search]);

    // 🔹 반경 1km 필터
    const radiusFiltered = useMemo(() => {
        if (!radiusFilter || !myPos) return filtered;

        return filtered.filter((p) => {
            const pos = getValidLatLon(p);
            if (!pos) return false;

            const d = getDistance(myPos.lat, myPos.lon, pos.lat, pos.lon);
            return d <= RADIUS;
        });
    }, [filtered, radiusFilter, myPos]);

    // 🔹 거리 기준 정렬
    const sorted = useMemo(() => {
        const list = radiusFiltered;

        if (sortOption !== "distance" || !myPos) return list;

        return [...list].sort((a, b) => {
            const A = getValidLatLon(a);
            const B = getValidLatLon(b);
            if (!A || !B) return 0;

            const d1 = getDistance(myPos.lat, myPos.lon, A.lat, A.lon);
            const d2 = getDistance(myPos.lat, myPos.lon, B.lat, B.lon);
            return d1 - d2;
        });
    }, [radiusFiltered, sortOption, myPos]);

    // 🔹 즐겨찾기 토글
    const toggleFavorite = async (item: any) => {
        if (!user?._id) return;

        const isFav = favIds.has(item.resourceId);

        if (isFav) {
            const doc = favorites.find((f) => f.resourceId === item.resourceId);
            if (doc) {
                await removeFavorite({ favoriteId: doc._id, userId: user._id });
                setFavorites((prev) => prev.filter((f) => f._id !== doc._id));
            }
        } else {
            const res = await addFavorite({
                userId: user._id,
                resourceId: item.resourceId,
                resourceType: "parking",
            });
            setFavorites((prev) => [...prev, res.data]);
        }
    };

    // 로딩 화면
    if (loading)
        return (
            <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" />
            </View>
        );

    return (
        <ScrollView className="p-4">

            {/* 검색창 */}
            <TextInput
                className="border px-3 py-2 rounded-lg mb-4"
                placeholder="주차장 검색"
                value={search}
                onChangeText={setSearch}
            />

            {/* 정렬 및 반경 필터 버튼 UI */}
            <View className="flex-row gap-2 mb-3">

                {/* 정렬 - 기본순 */}
                <Text
                    className={`px-3 py-1 rounded ${sortOption === "none"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-black"
                        }`}
                    onPress={() => setSortOption("none")}
                >
                    기본순
                </Text>

                {/* 정렬 - 거리순 */}
                <Text
                    className={`px-3 py-1 rounded ${sortOption === "distance"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-black"
                        }`}
                    onPress={() => setSortOption("distance")}
                >
                    거리순
                </Text>

                {/* 반경 1km 필터 */}
                <Text
                    className={`px-3 py-1 rounded ${radiusFilter
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-black"
                        }`}
                    onPress={() => setRadiusFilter(!radiusFilter)}
                >
                    1km 이내
                </Text>
            </View>

            {/* 리스트 렌더링 */}
            {sorted.map((item, idx) => (
                <ParkingCard
                    key={idx}
                    item={item}
                    isFavorite={favIds.has(item.resourceId)}
                    onToggleFavorite={() => toggleFavorite(item)}
                    onPress={() => { }}
                />
            ))}
        </ScrollView>
    );
}
