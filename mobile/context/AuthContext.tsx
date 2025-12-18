// context/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api, { login, register } from "../services/api"; // ✅ api 추가 import

type User = { _id: string; username: string } | null;

type AuthCtx = {
  user: User;
  loading: boolean;
  handleLogin: (payload: {
    username: string;
    password: string;
  }) => Promise<boolean>;
  handleRegister: (payload: {
    username: string;
    password: string;
  }) => Promise<boolean>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx>({
  user: null,
  loading: false,
  handleLogin: async () => false,
  handleRegister: async () => false,
  logout: async () => {},
});

const normalizeUser = (u: any): User => {
  if (!u) return null;
  return {
    _id: u._id ?? u.id ?? u.userId ?? "",
    username: u.username ?? "",
  };
};

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(false);

  // ✅ 부팅 시 토큰/유저 복원 + axios 기본헤더 세팅
  useEffect(() => {
    let alive = true;
    (async () => {
      const rawUser = await AsyncStorage.getItem("user");
      const token = await AsyncStorage.getItem("accessToken");

      if (!alive) return;

      if (token) {
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
      } else {
        delete api.defaults.headers.common.Authorization;
      }

      if (rawUser) {
        try {
          const u = normalizeUser(JSON.parse(rawUser));
          setUser(u && u._id ? u : null);
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const handleLogin = async (payload: {
    username: string;
    password: string;
  }) => {
    try {
      setLoading(true);

      const res = await login(payload);
      const token = res.data?.token ?? res.data?.accessToken ?? null;
      const u = normalizeUser(res.data?.user);

      if (!token || !u?._id) return false;

      // ✅ 저장
      await AsyncStorage.setItem("accessToken", token);
      await AsyncStorage.setItem("user", JSON.stringify(u));

      // ✅ 즉시 반영 (첫 요청부터 (with token) 보장)
      api.defaults.headers.common.Authorization = `Bearer ${token}`;

      setUser(u);
      return true;
    } catch (e) {
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (payload: {
    username: string;
    password: string;
  }) => {
    try {
      setLoading(true);

      const res = await register(payload);
      const token =
        res.data?.token ??
        res.data?.accessToken ??
        res.data?.jwt ??
        res.data?.data?.accessToken ??
        null;

      const u = normalizeUser(res.data?.user ?? res.data?.data?.user);

      // ✅ 회원가입 응답이 토큰을 안 주는 백엔드도 있으므로 방어
      if (token && u?._id) {
        await AsyncStorage.setItem("accessToken", token);
        await AsyncStorage.setItem("user", JSON.stringify(u));
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
        setUser(u);
      }

      // 토큰이 없어도 “회원가입 성공”으로 볼지 여부는 백엔드 정책에 따름
      return true;
    } catch (e) {
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem("accessToken");
    await AsyncStorage.removeItem("user");
    delete api.defaults.headers.common.Authorization;
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, loading, handleLogin, handleRegister, logout }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
