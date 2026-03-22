import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
});

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

// 2. (Response)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token หมดอายุ หรือ ไม่ถูกต้อง
      console.error("Session Expired, Redirecting to Login...");

      // ล้างข้อมูลเก่าออกให้หมด
      localStorage.clear();

      // ดีดกลับไปหน้า Login (ใช้ window.location เพื่อให้ Refresh หน้าใหม่)
      window.location.href = "/";
    }
    return Promise.reject(error);
  },
);

export default api;
