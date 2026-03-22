import React from "react";
import { Navigate } from "react-router-dom";

/**
 * PrivateRoute — guards a page by token AND role
 *
 * Usage:
 *   <PrivateRoute allowedRoles={["admin"]}>
 *     <AdminDashboard />
 *   </PrivateRoute>
 *
 * allowedRoles: string[] — roles that may access this route.
 *   If omitted / empty, any authenticated user is allowed.
 */
const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  // 1. ไม่มี token → ไปหน้า login
  if (!token || !role) {
    return <Navigate to="/" replace />;
  }

  // 2. มี token แต่ role ไม่ตรง → ส่งกลับ dashboard ของตัวเอง
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    const fallback =
      role === "admin"
        ? "/dashboard"
        : role === "teacher"
          ? "/teacher/dashboard"
          : "/student/dashboard";
    return <Navigate to={fallback} replace />;
  }

  return children;
};

export default PrivateRoute;
