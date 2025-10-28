// frontend/src/context/AuthContext.jsx
import React, { createContext, useContext, useState } from "react";
import { login as apiLogin, register as apiRegister } from "../services/api";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

// 다양한 응답 형태를 _id 기준으로 정규화
function normalizeUser(uLike) {
  if (!uLike) return null;
  const raw = uLike.user ?? uLike;
  const _id = raw?._id ?? raw?.id ?? raw?.userId ?? null;
  return _id ? { ...raw, _id } : raw;
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return normalizeUser(saved ? JSON.parse(saved) : null);
  });
  const [loading, setLoading] = useState(false);

  const handleLogin = async ({ username, password }) => {
    setLoading(true);
    try {
      const { data } = await apiLogin({ username, password });
      const u = normalizeUser(data);
      localStorage.setItem("user", JSON.stringify(u));
      setUser(u);
      return true;
    } catch (e) {
      console.error("로그인 실패", e);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async ({ username, password }) => {
    setLoading(true);
    try {
      await apiRegister({ username, password });
      return true;
    } catch (e) {
      console.error("회원가입 실패", e);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, handleLogin, handleRegister, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
