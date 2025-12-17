import axios from "axios";

// RN용 BASE_URL
const BASE_URL =
  "https://kyevhp3ds7.execute-api.ap-northeast-2.amazonaws.com/api";

// 메모리 내 토큰 (Authorization 헤더 주입용)
let authToken: string | null = null;

// AuthContext에서 로그인/로그아웃/복구 시 호출
export function setAuthToken(token: string | null) {
  authToken = token;
}

// Axios instance
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

// ==========================
// Interceptors
// ==========================
api.interceptors.request.use((config) => {
  // ✅ JWT 자동 첨부
  if (authToken) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${authToken}`;
  }

  console.log(
    "[REQ]",
    config.method?.toUpperCase(),
    (config.baseURL || "") + (config.url || "")
  );
  return config;
});

api.interceptors.response.use(
  (res) => {
    console.log("[RES]", res.status, res.config.url);
    return res;
  },
  (err) => {
    console.log("[ERR]", err.message);
    console.log(
      "[ERR] response?",
      !!err.response,
      "status:",
      err.response?.status
    );
    console.log("[ERR] request?", !!err.request);
    return Promise.reject(err);
  }
);

// ==========================
// Parkings
// ==========================
export const getAllParkings = () => api.get("/parkings");

// ==========================
// EV Chargers
// ==========================
export const getEvChargers = () => api.get("/evchargers");

// ==========================
// Auth
// ==========================
export const register = (payload: { username: string; password: string }) =>
  api.post("/auth/register", payload);

export const login = (payload: { username: string; password: string }) =>
  api.post("/auth/login", payload);

export const getProfile = (userId: string) =>
  api.get(`/auth/profile/${userId}`);

// ==========================
// Favorites
// ==========================
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
