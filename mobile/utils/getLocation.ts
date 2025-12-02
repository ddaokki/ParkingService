import * as Location from "expo-location";

export async function getMyLocation() {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
        return null;
    }

    const pos = await Location.getCurrentPositionAsync({});
    return {
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
    };
}
