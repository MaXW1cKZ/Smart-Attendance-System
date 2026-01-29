// src/App.jsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// Components
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login"; // อย่าลืมสร้างหรือเช็คว่ามีไฟล์นี้

// Student Pages
import StudentDashboard from "./pages/student/StudentDashboard";
import FaceRegister from "./pages/student/Faceregister"; // เช็คชื่อไฟล์ดีๆ (F ตัวใหญ่หรือเล็ก)

// Teacher Pages
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import CreateCourse from "./pages/teacher/CreateCourse";

// ตัวช่วย Redirect
const DashboardRedirect = () => {
  const role = localStorage.getItem("role");
  if (role === "teacher") return <Navigate to="/teacher/dashboard" replace />;
  if (role === "student") return <Navigate to="/student/dashboard" replace />;
  return <Navigate to="/" replace />; // ถ้าไม่มี Role เด้งออกไป Login
};

function App() {
  return (
    <Router>
      <Routes>
        {/* 1. หน้า Login (Public) */}
        <Route path="/" element={<Login />} />

        {/* 2. ตัวกลางแยกทาง (Redirector) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardRedirect />
            </ProtectedRoute>
          }
        />

        {/* 3. Zone นักเรียน */}
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/register-face"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <FaceRegister />
            </ProtectedRoute>
          }
        />

        {/* 4. Zone อาจารย์ */}
        <Route
          path="/teacher/dashboard"
          element={
            <ProtectedRoute allowedRoles={["teacher", "admin"]}>
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/create-course"
          element={
            <ProtectedRoute allowedRoles={["teacher", "admin"]}>
              <CreateCourse />
            </ProtectedRoute>
          }
        />

        {/* 5. ถ้าพิมพ์มั่วๆ ให้ดีดกลับไปหน้าแรก */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
