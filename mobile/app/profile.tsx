import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, ScrollView, Button } from "react-native";
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
            } catch (error) {
                console.log(error);
            } finally {
                setLoading(false);
            }
        })();
    }, [user]);

    if (!user) {
        return (
            <View className="flex-1 items-center justify-center">
                <Text>로그인이 필요합니다.</Text>
            </View>
        );
    }

    return (
        <ScrollView className="p-4">
            <Text className="text-2xl font-bold">{user.username} 님</Text>

            <Button title="로그아웃" onPress={logout} />

            <Text className="text-xl font-semibold mt-6 mb-2">즐겨찾기 목록</Text>

            {loading && <ActivityIndicator />}

            {!loading &&
                favorites.map((fav, index) => (
                    <View key={index} className="p-3 border-b border-gray-200">
                        <Text className="text-lg font-semibold">{fav.resourceName}</Text>
                        <Text className="text-gray-600">{fav.resourceType}</Text>
                    </View>
                ))}
        </ScrollView>
    );
}
