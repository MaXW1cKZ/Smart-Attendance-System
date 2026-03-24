import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api/axios";
import {
  FiHome,
  FiBook,
  FiFileText,
  FiMonitor,
  FiLogOut,
  FiCamera,
  FiCalendar,
  FiPieChart,
  FiSettings,
  FiShield,
  FiPlusSquare,
  FiActivity,
  FiUsers,
  FiServer,
  FiList,
  FiMenu,
  FiX,
} from "react-icons/fi";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const userName = localStorage.getItem("user_name") || "Guest";
  const role = localStorage.getItem("role") || "student";

  const [activeSessionId, setActiveSessionId] = useState(null);
  useEffect(() => {
    const checkActiveSession = async () => {
      try {
        console.log("Checking session..."); // ดักดูว่าฟังก์ชันรันไหม

        // อย่าลืม import api ไว้บนสุดของไฟล์ด้วยนะครับ!
        const res = await api.get("sessions/active");
        console.log("Session API Response:", res.data); // ดูค่าที่ Backend ส่งมา

        if (res.data && res.data.active) {
          setActiveSessionId(res.data.session_id);
        } else {
          setActiveSessionId(null); // เคลียร์ค่าถ้าไม่มี session
        }
      } catch (err) {
        console.error("Session check failed:", err); // เปลี่ยนให้ปริ้นท์ err ออกมาดูด้วย
        setActiveSessionId(null);
      }
    };

    // รันเช็คเฉพาะตอนเป็น teacher ก็ได้ครับ จะได้ประหยัด Request
    if (role === "teacher") {
      checkActiveSession();
    }
  }, [location.pathname, role]);
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const getMenuItems = () => {
    if (role === "admin")
      return [
        { icon: <FiServer />, label: "Dashboard", path: "/admin/dashboard" },
        { icon: <FiUsers />, label: "User Management", path: "/admin/users" },
        {
          icon: <FiPlusSquare />,
          label: "Create Course",
          path: "/admin/create-course",
        },
        { icon: <FiBook />, label: "Course Overview", path: "/admin/courses" },
        {
          icon: <FiCalendar />,
          label: "Attendance History",
          path: "/admin/attendance-history",
        },
        { icon: <FiList />, label: "Activity Log", path: "/admin/logs" },
      ];
    if (role === "teacher")
      return [
        {
          icon: <FiMonitor />,
          label: "Start Session",
          path: "/teacher/device-setup",
        },
        { icon: <FiHome />, label: "Dashboard", path: "/teacher/dashboard" },
        {
          icon: <FiPlusSquare />,
          label: "Create Course",
          path: "/teacher/create-course",
        },
        {
          icon: <FiSettings />,
          label: "Course Settings",
          path: "/teacher/course-settings",
        },
        {
          icon: <FiFileText />,
          label: "Attendance Report",
          path: "/teacher/attendance-report",
        },
      ];
    return [
      { icon: <FiHome />, label: "Dashboard", path: "/student/dashboard" },
      {
        icon: <FiCamera />,
        label: "Face Register",
        path: "/student/register-face",
      },
      { icon: <FiPlusSquare />, label: "Join Course", path: "/student/enroll" },
      {
        icon: <FiPieChart />,
        label: "Attendance Report",
        path: "/student/stu-attendance",
      },
    ];
  };

  const menuItems = getMenuItems();
  const activeClass =
    role === "admin"
      ? "bg-slate-700 text-white shadow-md shadow-slate-200"
      : "bg-blue-600 text-white shadow-md shadow-blue-200";

  const SidebarContent = () => (
    <aside className="w-64 bg-white flex flex-col justify-between h-full font-sans">
      <div>
        <div className="p-6 flex items-center justify-between">
          <h1 className="text-xl font-bold text-blue-600">
            Smart <span className="text-black">Attendance</span>
          </h1>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition"
          >
            <FiX size={18} />
          </button>
        </div>

        {role === "admin" && (
          <div className="px-6 -mt-2 mb-2">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              <FiShield size={10} /> Admin
            </span>
          </div>
        )}

        {role === "teacher" && activeSessionId && (
          <div className="px-4 mb-4">
            <div
              onClick={() =>
                navigate(`/teacher/session/${activeSessionId}/live`)
              }
              className="bg-red-50 border border-red-100 p-3 rounded-xl cursor-pointer hover:bg-red-100 transition-all flex items-center gap-3"
            >
              <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse" />
              <div className="flex-1">
                <p className="text-xs font-bold text-red-500 uppercase tracking-wide">
                  Live Session
                </p>
                <p className="text-[10px] text-red-400 font-medium">
                  Click to return
                </p>
              </div>
              <FiActivity className="text-red-500 animate-pulse" />
            </div>
          </div>
        )}

        <nav className="mt-2 px-4 space-y-1">
          {menuItems.map((item, i) => {
            const isActive = location.pathname === item.path;
            return (
              <div
                key={i}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 ${
                  isActive
                    ? activeClass
                    : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
                {isActive && <span className="ml-auto text-xs">›</span>}
              </div>
            );
          })}
        </nav>
      </div>

      <div className="p-6 border-t border-gray-50">
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
              role === "admin"
                ? "bg-gradient-to-br from-slate-500 to-slate-700"
                : "bg-gradient-to-br from-blue-400 to-purple-500"
            }`}
          >
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-gray-800 truncate">
              {userName}
            </p>
            <p className="text-xs text-gray-500 capitalize">{role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-red-400 hover:text-red-600 font-semibold px-2 py-2 rounded-lg hover:bg-red-50 transition w-full"
        >
          <FiLogOut /> Log out
        </button>
      </div>
    </aside>
  );

  return (
    <>
      <div className="hidden md:flex h-screen sticky top-0 border-r border-gray-100 shrink-0">
        <SidebarContent />
      </div>

      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-white rounded-xl shadow-md border border-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition"
      >
        <FiMenu size={18} />
      </button>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-50 h-full shadow-2xl">
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
