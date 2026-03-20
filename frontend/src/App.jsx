import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";

// Student
import StudentDashboard from "./pages/student/StudentDashboard";
import FaceRegister from "./pages/student/Faceregister";
import Stu_Attendance from "./pages/student/s_AttendanceReport";
import StudentEnroll from "./pages/student/StudentEnroll";

// Teacher
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import CreateCourse from "./pages/teacher/CreateCourse";
import CourseSettings from "./pages/teacher/CourseSettings";
import AttendanceReport from "./pages/teacher/AttendanceReport";
import DeviceSetup from "./pages/teacher/DeviceSetup";
import RealTimeAttendance from "./pages/teacher/RealTimeAttendance";
import EnrolledStudents from "./pages/teacher/EnrolledStudents";

// Admin
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import AdminCreateCourse from "./pages/admin/AdminCreateCourse";
import StudentAttendanceHistory from "./pages/admin/StudentAttendanceHistory";
import CourseOverview from "./pages/admin/CourseOverview";
import ActivityLog from "./pages/admin/Activitylog";

const DashboardRedirect = () => {
  const role = localStorage.getItem("role");
  if (role === "admin") return <Navigate to="/admin/dashboard" replace />;
  if (role === "teacher") return <Navigate to="/teacher/dashboard" replace />;
  if (role === "student") return <Navigate to="/student/dashboard" replace />;
  localStorage.clear();
  return <Navigate to="/" replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardRedirect />
            </ProtectedRoute>
          }
        />

        {/* ── Student ── */}
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
        <Route
          path="/student/stu-attendance"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <Stu_Attendance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/enroll"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentEnroll />
            </ProtectedRoute>
          }
        />

        {/* ── Teacher ── */}
        <Route
          path="/teacher/dashboard"
          element={
            <ProtectedRoute allowedRoles={["teacher"]}>
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/create-course"
          element={
            <ProtectedRoute allowedRoles={["teacher"]}>
              <CreateCourse />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/course-settings"
          element={
            <ProtectedRoute allowedRoles={["teacher"]}>
              <CourseSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/attendance-report"
          element={
            <ProtectedRoute allowedRoles={["teacher"]}>
              <AttendanceReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/device-setup"
          element={
            <ProtectedRoute allowedRoles={["teacher"]}>
              <DeviceSetup />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/session/:sessionId/live"
          element={
            <ProtectedRoute allowedRoles={["teacher"]}>
              <RealTimeAttendance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/course/:courseId/students"
          element={
            <ProtectedRoute allowedRoles={["teacher"]}>
              <EnrolledStudents />
            </ProtectedRoute>
          }
        />

        {/* ── Admin ── */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <UserManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/create-course"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminCreateCourse />{" "}
              {/* ใช้ AdminCreateCourse ตามไฟล์ที่คุณมี */}
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/courses"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <CourseOverview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/attendance-history"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <StudentAttendanceHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/logs"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <ActivityLog />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/attendance-report"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AttendanceReport />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
