// context/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { login, register } from "../services/api";

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

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const rawUser = await AsyncStorage.getItem("user");
      if (rawUser) setUser(JSON.parse(rawUser));
    })();
  }, []);

  const handleLogin = async (payload: {
    username: string;
    password: string;
  }) => {
    setLoading(true);
    try {
      const res = await login(payload);

      const token =
        res.data?.accessToken ??
        res.data?.token ??
        res.data?.jwt ??
        res.data?.data?.accessToken;
      const u =
        res.data?.user ?? res.data?.data?.user ?? res.data?.profile ?? null;

      if (!token || !u?._id) return false;

      await AsyncStorage.setItem("accessToken", token);
      await AsyncStorage.setItem("user", JSON.stringify(u));
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
    setLoading(true);
    try {
      const res = await register(payload);

      const token =
        res.data?.accessToken ??
        res.data?.token ??
        res.data?.jwt ??
        res.data?.data?.accessToken;
      const u = res.data?.user ?? res.data?.data?.user ?? null;

      // 회원가입 직후 자동 로그인까지 하고 싶으면 token/user가 내려오는 경우 저장
      if (token && u?._id) {
        await AsyncStorage.setItem("accessToken", token);
        await AsyncStorage.setItem("user", JSON.stringify(u));
        setUser(u);
      }
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
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, loading, handleLogin, handleRegister, logout }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
