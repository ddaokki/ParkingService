import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080/api",
});

export const getAllParkings = () => api.get("/parkings");
export const getEvChargers = () => api.get("/evchargers");

export default api;
