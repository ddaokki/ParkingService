// 전기차 충전소 탭 제거 버전
import React from "react";
<<<<<<< HEAD
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import EvChargerList from "./pages/EvChargerList";
import MapView from "./pages/MapView";
=======
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import ParkingList from "./pages/ParkingList";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import AuthProvider, { useAuth } from "./context/AuthContext";
>>>>>>> a1aa543 (프론트엔드 지피티로 만듦)

function Nav() {
  const { user } = useAuth();
  return (
<<<<<<< HEAD
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
=======
    <nav className="flex items-center gap-4 p-3 border-b">
      <Link to="/" className="font-semibold">주차장 정보</Link>
      <span className="flex-1" />
      {user ? (
        <Link to="/profile" className="text-sm">{user.username || "내 프로필"}</Link>
      ) : (
        <>
          <Link to="/login" className="text-sm">로그인</Link>
          <Link to="/register" className="text-sm">회원가입</Link>
        </>
      )}
    </nav>
>>>>>>> a1aa543 (프론트엔드 지피티로 만듦)
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Nav />
        <Routes>
          <Route path="/" element={<ParkingList />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
