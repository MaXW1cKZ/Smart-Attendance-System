import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  // ดึง Token ออกมาเช็ค
  const token = localStorage.getItem('token');

  // ถ้าไม่มี Token -> ดีดกลับไปหน้า Login (path "/")
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // ถ้ามี -> ให้ผ่านไปได้ (Render หน้า Dashboard)
  return children;
};

export default PrivateRoute;