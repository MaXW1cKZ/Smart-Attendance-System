// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  // 1. ไม่มี Token -> ไป Login
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // 2. มี Token แต่เข้าผิด Role
  if (allowedRoles && !allowedRoles.includes(role)) {
    if (role === "student") {
      return <Navigate to="/student/dashboard" replace />;
    }
    if (role === "teacher") {
      return <Navigate to="/teacher/dashboard" replace />;
    }
    // ถ้า Role แปลกประหลาด ให้ Logout ไปเลย
    localStorage.clear();
    return <Navigate to="/" replace />;
  }

  // 3. ผ่าน
  return children;
};

export default ProtectedRoute;
