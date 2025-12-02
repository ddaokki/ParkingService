// ==========================
// 1) Haversine 거리 계산
// ==========================
export function getDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    function deg2rad(deg: number) {
        return deg * (Math.PI / 180);
    }

    const R = 6371e3; // 지구 반지름 (미터)
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // meters
}

// ==========================
// 2) 좌표 유효성 검사 (없으면 null)
// ==========================
export function getValidLatLon(item: any): { lat: number; lon: number } | null {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);

    if (!lat || !lon || isNaN(lat) || isNaN(lon)) return null;

    return { lat, lon };
}
