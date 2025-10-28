// Haversine 거리(m 단위)
export function distanceMeters(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad((lat2 ?? 0) - (lat1 ?? 0));
  const dLon = toRad((lon2 ?? 0) - (lon1 ?? 0));
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1 ?? 0)) * Math.cos(toRad(lat2 ?? 0)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function pickLat(item) {
  return Number(item?.lat ?? item?.LAT ?? item?.latitude ?? item?.Latitude ?? 0);
}
export function pickLon(item) {
  return Number(item?.lon ?? item?.LOT ?? item?.longitude ?? item?.Longitude ?? 0);
}
