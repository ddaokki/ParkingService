import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import ParkingList from "./pages/ParkingList";
import EvChargerList from "./pages/EvChargerList";

function App() {
  return (
    <Router>
      {/* 상단 네비게이션 바 */}
      <nav className="bg-gray-800 text-white px-6 py-3 flex justify-between items-center">
        <h1 className="text-xl font-semibold">🚗 서울시 주차장 통합 서비스</h1>
        <div className="space-x-4">
          <Link to="/" className="hover:underline">
            주차장 정보
          </Link>
          <Link to="/evchargers" className="hover:underline">
            전기차 충전소
          </Link>
        </div>
      </nav>

      {/* 라우팅 영역 */}
      <div className="p-6 bg-gray-50 min-h-screen">
        <Routes>
          <Route path="/" element={<ParkingList />} />
          <Route path="/evchargers" element={<EvChargerList />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
