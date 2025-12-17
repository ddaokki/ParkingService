import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  login as apiLogin,
  register as apiRegister,
  setAuthToken,
} from "../services/api";

// 저장 키
const USER_KEY = "user";
const TOKEN_KEY = "token";

// 유저 타입
export interface User {
  _id: string;
  username: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  handleLogin: (params: {
    username: string;
    password: string;
  }) => Promise<boolean>;
  handleRegister: (params: {
    username: string;
    password: string;
  }) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);
export const useAuth = () => useContext(AuthContext)!;

// user normalize (서버 응답 형식 차이에 대비)
function normalizeUser(uLike: any): User | null {
  if (!uLike) return null;
  const raw = uLike.user ?? uLike;
  const _id = raw?._id ?? raw?.id ?? raw?.userId ?? null;
  return _id ? { ...raw, _id } : null;
}

// 로그인 응답에서 토큰 추출(서버 구현 차이 대비)
function extractToken(data: any): string | null {
  return (
    data?.token ??
    data?.accessToken ??
    data?.jwt ??
    data?.data?.token ??
    data?.data?.accessToken ??
    null
  );
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // 앱 시작 시 저장된 user/token 복구
  useEffect(() => {
    (async () => {
      try {
        const savedUser = await AsyncStorage.getItem(USER_KEY);
        if (savedUser) setUser(normalizeUser(JSON.parse(savedUser)));

        const savedToken = await AsyncStorage.getItem(TOKEN_KEY);
        if (savedToken) setAuthToken(savedToken);
      } catch (e) {
        console.log("[Auth] restore failed:", e);
      }
    })();
  }, []);

  // 로그인
  const handleLogin = async ({
    username,
    password,
  }: {
    username: string;
    password: string;
  }): Promise<boolean> => {
    setLoading(true);
    try {
      const res = await apiLogin({ username, password });

      // ✅ 토큰 저장 + axios에 주입
      const token = extractToken(res.data);
      if (token) {
        await AsyncStorage.setItem(TOKEN_KEY, token);
        setAuthToken(token);
      } else {
        console.log("[Auth] token not found in login response:", res.data);
        // 토큰이 없으면 favorites 같은 인증 API는 계속 401이 날 수 있음
      }

      // ✅ user 저장
      const u = normalizeUser(res.data);
      if (u) {
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(u));
        setUser(u);
        return true;
      }

      return false;
    } catch (e) {
      console.log("로그인 실패:", e);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 회원가입
  const handleRegister = async ({
    username,
    password,
  }: {
    username: string;
    password: string;
  }): Promise<boolean> => {
    setLoading(true);
    try {
      await apiRegister({ username, password });
      return true;
    } catch (e) {
      console.log("회원가입 실패:", e);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 로그아웃
  const logout = async () => {
    try {
      await AsyncStorage.removeItem(USER_KEY);
      await AsyncStorage.removeItem(TOKEN_KEY);
      setAuthToken(null);
      setUser(null);
    } catch (e) {
      console.log("로그아웃 실패:", e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        handleLogin,
        handleRegister,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
