// services/api.ts
import axios, { AxiosError } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL =
  "https://kyevhp3ds7.execute-api.ap-northeast-2.amazonaws.com/api";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
});

// ---- 디버그 유틸 ----
const mask = (obj: any) => {
  if (!obj || typeof obj !== "object") return obj;
  const cloned = JSON.parse(JSON.stringify(obj));
  if ("password" in cloned) cloned.password = "***";
  if ("Authorization" in cloned) cloned.Authorization = "***";
  return cloned;
};

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("accessToken");

    config.headers = config.headers ?? {};
    if (token) config.headers.Authorization = `Bearer ${token}`;

    const method = (config.method || "GET").toUpperCase();
    const url = (config.baseURL || "") + (config.url || "");

    console.log(
      `[REQ] ${method} ${url} ${token ? "(with token)" : "(no token)"}`
    );
    if (config.params) console.log("[REQ params]", mask(config.params));
    //if (config.data) console.log("[REQ body]", mask(config.data));
    if (config.headers) {
      const h: any = { ...config.headers };
      if (h.Authorization) h.Authorization = "***";
      console.log("[REQ headers]", h);
    }

    return config;
  },
  (err) => {
    console.log("[REQ interceptor error]", err);
    return Promise.reject(err);
  }
);

api.interceptors.response.use(
  (res) => {
    const url = (res.config.baseURL || "") + (res.config.url || "");

    // 데이터는 찍지 않고, 배열이면 개수만 표시
    if (Array.isArray(res.data)) {
      console.log(`[RES] ${res.status} ${url} (items: ${res.data.length})`);
    } else {
      console.log(`[RES] ${res.status} ${url}`);
    }

    return res;
  },
  async (err: AxiosError<any>) => {
    const status = err.response?.status;
    const url = (err.config?.baseURL || "") + (err.config?.url || "");

    console.log(`[ERR] ${status ?? "NO_STATUS"} ${url}`);
    console.log("[ERR message]", err.message);

    return Promise.reject(err);
  }
);

// ---- API 함수들 ----
export const getAllParkings = () => api.get("/parkings");

// Auth
export const register = (payload: { username: string; password: string }) =>
  api.post("/auth/register", payload);

export const login = (payload: { username: string; password: string }) =>
  api.post("/auth/login", payload);

export const getProfile = (userId: string) =>
  api.get(`/auth/profile/${userId}`);

// Favorites
export const getFavoritesByUser = (userId: string) =>
  api.get(`/favorites/user/${userId}`);

export const addFavorite = (params: {
  userId: string;
  resourceId: string;
  resourceType: "parking" | "evcharger";
}) => api.post("/favorites", params);

export const removeFavorite = (params: {
  favoriteId: string;
  userId: string;
}) =>
  api.delete(`/favorites/${params.favoriteId}`, {
    data: { userId: params.userId },
  });

export default api;
