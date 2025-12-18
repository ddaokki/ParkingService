// services/api.ts
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL =
  "https://kyevhp3ds7.execute-api.ap-northeast-2.amazonaws.com/api";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

// ✅ 요청마다 토큰 자동 첨부
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("accessToken");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  // 디버그 로그(원하시면 제거)
  // console.log("[REQ]", config.method?.toUpperCase(), config.url, !!token);
  return config;
});

// ✅ 401 디버그
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    // console.log("[ERR]", err?.response?.status, err?.config?.url);
    return Promise.reject(err);
  }
);

// Parkings
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
  resourceId: string | number;
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
