import axios from "axios";

// ★ RN용 BASE_URL 설정 (AWS로 옮기면 이 부분만 수정)
const BASE_URL = "http://192.168.234.231:4000/api";  // ← 본인 PC IP로 변경

// Axios instance
const api = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
});

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
export const register = (payload: {
    username: string;
    password: string;
}) => api.post("/auth/register", payload);

export const login = (payload: {
    username: string;
    password: string;
}) => api.post("/auth/login", payload);

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
