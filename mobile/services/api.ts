// services/api.ts
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL =
  "https://kyevhp3ds7.execute-api.ap-northeast-2.amazonaws.com/api";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("accessToken");
  config.headers = config.headers ?? {};
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // 디버그
  // console.log("[REQ]", config.method?.toUpperCase(), config.baseURL + config.url, token ? "(with token)" : "(no token)");
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    // console.log("[ERR]", err?.response?.status, err?.config?.url, err?.response?.data);
    return Promise.reject(err);
  }
);

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

/**
 * 백엔드가 DELETE /favorites/:id 에서 userId를 body로 요구하는 형태로 보이므로 그대로 유지
 */
export const removeFavorite = (params: {
  favoriteId: string;
  userId: string;
}) =>
  api.delete(`/favorites/${params.favoriteId}`, {
    data: { userId: params.userId },
  });

export default api;
