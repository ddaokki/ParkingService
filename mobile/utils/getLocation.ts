import * as Location from "expo-location";

export async function getMyLocation(): Promise<{
  lat: number;
  lon: number;
} | null> {
  try {
    // 권한 요청
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      console.log("[Location] permission denied");
      return null;
    }

    // 마지막 위치가 있으면 먼저 사용(빠름)
    const last = await Location.getLastKnownPositionAsync({});
    if (last?.coords) {
      return { lat: last.coords.latitude, lon: last.coords.longitude };
    }

    // 현재 위치 (너무 높은 정확도는 느려질 수 있음)
    const cur = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return { lat: cur.coords.latitude, lon: cur.coords.longitude };
  } catch (e) {
    console.log("[Location] error:", e);
    return null;
  }
}
