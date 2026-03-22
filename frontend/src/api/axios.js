import axios from "axios";

// ใช้ /api/ prefix เพื่อให้ nginx proxy ไป backend
// ตอน dev ให้ตั้ง VITE_API_URL=http://localhost:8000 ใน .env.local
const baseURL = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
  baseURL,
});

// ขาไป (Request): แนบ Token
//   baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
// });

// 1. ขาไป (Request): แนบ Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ขากลับ (Response)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error("Session Expired, Redirecting to Login...");
      localStorage.clear();
      window.location.href = "/";
    }
    return Promise.reject(error);
  },
);

export default api;
