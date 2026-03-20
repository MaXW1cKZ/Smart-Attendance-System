// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token) return <Navigate to="/" replace />;

  if (allowedRoles && !allowedRoles.includes(role)) {
    if (role === "admin") return <Navigate to="/admin/dashboard" replace />;
    if (role === "teacher") return <Navigate to="/teacher/dashboard" replace />;
    if (role === "student") return <Navigate to="/student/dashboard" replace />;
    localStorage.clear();
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
