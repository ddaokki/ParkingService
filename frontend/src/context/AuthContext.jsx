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
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  const handleLogin = async ({ username, password }) => {
    setLoading(true);
    try {
      const { data } = await apiLogin({ username, password });
      const normalizedUser = normalizeUser(data.user ?? data);
      if (!normalizedUser) throw new Error("사용자 정보가 올바르지 않습니다.");

      // 유저 정보 / 토큰 저장
      setUser(normalizedUser);
      localStorage.setItem("user", JSON.stringify(normalizedUser));
      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      return true;
    } catch (err) {
      console.error("로그인 실패:", err);
      alert(err?.response?.data?.message ?? "로그인에 실패했습니다.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async ({ username, password }) => {
    setLoading(true);
    try {
      const { data } = await apiRegister({ username, password });

      // 회원가입 시에도 백엔드에서 token을 내려주도록 되어 있으니 자동 로그인 처리
      const normalizedUser = normalizeUser(data.user ?? data);
      if (normalizedUser) {
        setUser(normalizedUser);
        localStorage.setItem("user", JSON.stringify(normalizedUser));
      }
      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      return true;
    } catch (err) {
      console.error("회원가입 실패:", err);
      alert(err?.response?.data?.message ?? "회원가입에 실패했습니다.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, handleLogin, handleRegister, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
