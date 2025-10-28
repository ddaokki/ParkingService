// frontend/src/services/api.js
import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || "http://localhost:8080/api",
  timeout: 15000,
});

// ---- Parkings ----
export const getAllParkings = () => api.get("/parkings");

// ---- EV Chargers ----
export const getEvChargers = () => api.get("/evchargers");

// ---- Auth ----
export const register = (payload) => api.post("/auth/register", payload);
export const login = (payload) => api.post("/auth/login", payload);
export const getProfile = (userId) => api.get(`/auth/profile/${userId}`);

// ---- Favorites ----
export const getFavoritesByUser = (userId) => api.get(`/favorites/user/${userId}`);
export const addFavorite = ({ userId, resourceId, resourceType }) =>
  api.post("/favorites", { userId, resourceId, resourceType });
export const removeFavorite = ({ favoriteId, userId }) =>
  api.delete(`/favorites/${favoriteId}`, { data: { userId } });

export default api;
