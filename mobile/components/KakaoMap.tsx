// components/KakaoMap.tsx
import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";

type MarkerItem = { id: string; title: string; lat: number; lon: number };

type Props = {
  height?: number;
  center: { lat: number; lon: number } | null;
  myPos?: { lat: number; lon: number } | null;
  markers: MarkerItem[];
};

export default function KakaoMap({
  height = 260,
  center,
  myPos,
  markers,
}: Props) {
  const key = process.env.EXPO_PUBLIC_KAKAO_MAP_JS_KEY; // ✅ .env에 넣은 방식

  const html = useMemo(() => {
    const safeCenter = center ?? { lat: 37.5665, lon: 126.978 };
    const markerJson = JSON.stringify(markers);

    return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <style>
    html, body { margin:0; padding:0; height:100%; }
    #map { width:100%; height:100%; }
  </style>
  <script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false"></script>
</head>
<body>
  <div id="map"></div>
  <script>
    kakao.maps.load(function() {
      var mapContainer = document.getElementById('map');
      var mapOption = {
        center: new kakao.maps.LatLng(${safeCenter.lat}, ${safeCenter.lon}),
        level: 4
      };
      var map = new kakao.maps.Map(mapContainer, mapOption);

      // 내 위치 마커(파란색 이미지)
      ${
        myPos
          ? `
      var myImageSrc = "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png";
      var myImageSize = new kakao.maps.Size(24, 35);
      var myMarkerImage = new kakao.maps.MarkerImage(myImageSrc, myImageSize);

      var myMarker = new kakao.maps.Marker({
        position: new kakao.maps.LatLng(${myPos.lat}, ${myPos.lon}),
        image: myMarkerImage
      });
      myMarker.setMap(map);
      `
          : ""
      }

      // 주차장 마커(기본 빨간 마커)
      var list = ${markerJson};
      list.forEach(function(m) {
        var marker = new kakao.maps.Marker({
          position: new kakao.maps.LatLng(m.lat, m.lon)
        });
        marker.setMap(map);
      });

      // 마커들이 있으면 화면에 맞추기
      if (list.length > 0) {
        var bounds = new kakao.maps.LatLngBounds();
        ${
          myPos
            ? `bounds.extend(new kakao.maps.LatLng(${myPos.lat}, ${myPos.lon}));`
            : ""
        }
        list.forEach(function(m){ bounds.extend(new kakao.maps.LatLng(m.lat, m.lon)); });
        map.setBounds(bounds);
      }
    });
  </script>
</body>
</html>
`;
  }, [key, center, myPos, markers]);

  return (
    <View style={[styles.wrap, { height }]}>
      <WebView
        originWhitelist={["*"]}
        source={{ html }}
        javaScriptEnabled
        domStorageEnabled
        style={styles.webview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  webview: { flex: 1 },
});
