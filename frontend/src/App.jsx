// 전기차 충전소 탭 제거 버전
import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import ParkingList from "./pages/ParkingList";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import AuthProvider, { useAuth } from "./context/AuthContext";

function Nav() {
  const { user } = useAuth();
  return (
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
