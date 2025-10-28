import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import EvChargerList from "./pages/EvChargerList";
import MapView from "./pages/MapView";

function App() {
  return (
    <Router>
      <nav className="bg-gray-800 text-white px-6 py-3 flex justify-between items-center">
        <h1 className="text-xl font-semibold">🚗 서울시 주차장 통합 서비스</h1>
        <div className="space-x-4">
          <Link to="/">지도 보기</Link> {/* ✅ 홈 화면 = 지도 */}
          <Link to="/evchargers">전기차 충전소</Link>
        </div>
      </nav>

      <div className="p-6 bg-gray-50 min-h-screen">
        <Routes>
          {/* ✅ 홈 화면에서 지도(MapView) 표시 */}
          <Route path="/" element={<MapView />} />
          <Route path="/evchargers" element={<EvChargerList />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
