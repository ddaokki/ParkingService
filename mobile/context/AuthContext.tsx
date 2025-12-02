import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

// ★ API 기본 URL (나중에 AWS Lambda 주소로 교체)
const BASE_URL = "http://localhost:4000/api";

// 유저 타입 정의 (필요 시 확장 가능)
export interface User {
    _id: string;
    username: string;
    [key: string]: any;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    handleLogin: (params: { username: string; password: string }) => Promise<boolean>;
    handleRegister: (params: { username: string; password: string }) => Promise<boolean>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);
export const useAuth = () => useContext(AuthContext)!;

// =====================================================
// normalizeUser (웹 버전과 동일)
// =====================================================
function normalizeUser(uLike: any): User | null {
    if (!uLike) return null;
    const raw = uLike.user ?? uLike;
    const _id = raw?._id ?? raw?.id ?? raw?.userId ?? null;
    return _id ? { ...raw, _id } : null;
}

// =====================================================
// AuthProvider (RN 버전)
// =====================================================
export default function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    // -----------------------------
    // 앱 시작 시 저장된 로그인 정보 불러오기
    // -----------------------------
    useEffect(() => {
        (async () => {
            try {
                const saved = await AsyncStorage.getItem("user");
                if (saved) {
                    const parsed = JSON.parse(saved);
                    setUser(normalizeUser(parsed));
                }
            } catch (e) {
                console.log("Failed to load saved user:", e);
            }
        })();
    }, []);

    // -----------------------------
    // 로그인
    // -----------------------------
    const handleLogin = async ({
        username,
        password,
    }: {
        username: string;
        password: string;
    }): Promise<boolean> => {
        setLoading(true);
        try {
            const res = await axios.post(`${BASE_URL}/auth/login`, {
                username,
                password,
            });

            const u = normalizeUser(res.data);
            if (u) {
                await AsyncStorage.setItem("user", JSON.stringify(u));
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

    // -----------------------------
    // 회원가입
    // -----------------------------
    const handleRegister = async ({
        username,
        password,
    }: {
        username: string;
        password: string;
    }): Promise<boolean> => {
        setLoading(true);
        try {
            await axios.post(`${BASE_URL}/auth/register`, {
                username,
                password,
            });
            return true;
        } catch (e) {
            console.log("회원가입 실패:", e);
            return false;
        } finally {
            setLoading(false);
        }
    };

    // -----------------------------
    // 로그아웃
    // -----------------------------
    const logout = async () => {
        try {
            await AsyncStorage.removeItem("user");
            setUser(null);
        } catch (e) {
            console.log("로그아웃 실패:", e);
        }
    };

    return (
        <AuthContext.Provider
            value={{ user, loading, handleLogin, handleRegister, logout }}
        >
            {children}
        </AuthContext.Provider>
    );
}
