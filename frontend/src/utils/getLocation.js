export function getCurrentPosition() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) reject("GPS 미지원 브라우저입니다.");
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                resolve({
                    lat: pos.coords.latitude,
                    lon: pos.coords.longitude,
                });
            },
            (err) => reject("위치 정보를 가져올 수 없습니다.")
        );
    });
}
