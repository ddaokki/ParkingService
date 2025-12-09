// frontend/src/services/api.js
import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || "https://kyevhp3ds7.execute-api.ap-northeast-2.amazonaws.com/api",
  timeout: 15000,
});

// 요청마다 JWT 토큰을 Authorization 헤더에 자동으로 붙인다.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = config.headers || {};
      // 백엔드에서 사용하는 형식: "Bearer <token>"
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---- Parkings ----
export const getAllParkings = () => api.get("/parkings");

// ---- EV Chargers ----
export const getEvChargers = () => api.get("/evchargers");

// ---- Auth ----
// 회원가입 / 로그인은 payload: { username, password }
export const register = (payload) => api.post("/auth/register", payload);
export const login = (payload) => api.post("/auth/login", payload);
// 프로필은 :userId 파라미터 + 토큰으로 인증
export const getProfile = (userId) => api.get(`/auth/profile/${userId}`);

// ---- Favorites ----
// 즐겨찾기 목록 조회 (userId는 URL 파라미터, 실제 권한 체크는 토큰의 user.id 기준)
export const getFavoritesByUser = (userId) =>
  api.get(`/favorites/user/${userId}`);

// 즐겨찾기 추가: userId는 이제 서버에서 토큰으로 알 수 있으므로 보내지 않아도 됨
export const addFavorite = ({ userId, resourceId, resourceType }) =>
  api.post("/favorites", { resourceId, resourceType });

// 즐겨찾기 삭제: body에 userId 전달할 필요 없음
export const removeFavorite = ({ favoriteId, userId }) =>
  api.delete(`/favorites/${favoriteId}`);

export default api;
