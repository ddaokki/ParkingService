import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { getAllParkings } from "../services/api";
import { getValidLatLon } from "../utils/geo";
import { getMyLocation } from "../utils/getLocation";

export default function MapScreen() {
    const [parkings, setParkings] = useState<any[]>([]);
    const [myPos, setMyPos] = useState<{ lat: number; lon: number } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            const pos = await getMyLocation();
            if (pos) setMyPos(pos);

            const res = await getAllParkings();
            setParkings(res.data);

            setLoading(false);
        })();
    }, []);

    if (loading || !myPos)
        return (
            <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" />
            </View>
        );

    return (
        <MapView
            style={{ flex: 1 }}
            initialRegion={{
                latitude: myPos.lat,
                longitude: myPos.lon,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            }}
        >
            {/* 내 위치 */}
            <Marker
                coordinate={{ latitude: myPos.lat, longitude: myPos.lon }}
                title="내 위치"
                pinColor="blue"
            />

            {/* 주차장 마커 */}
            {parkings.map((p, idx) => {
                const pos = getValidLatLon(p);
                if (!pos) return null;

                return (
                    <Marker
                        key={idx}
                        coordinate={{
                            latitude: pos.lat,
                            longitude: pos.lon,
                        }}
                        title={p.name}
                    />
                );
            })}
        </MapView>
    );
}
