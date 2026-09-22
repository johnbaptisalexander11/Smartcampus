import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  maxBodyLength: 15 * 1024 * 1024,
  maxContentLength: 15 * 1024 * 1024,
});

api.interceptors.request.use((config) => {
  const stored = localStorage.getItem("canteen_auth");
  if (stored) {
    try {
      const { token } = JSON.parse(stored);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      localStorage.removeItem("canteen_auth");
    }
  }
  return config;
});

export default api;
