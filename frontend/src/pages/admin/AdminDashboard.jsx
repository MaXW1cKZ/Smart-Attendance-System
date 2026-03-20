import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import Sidebar from "../../components/Sidebar";
import {
  FiUsers,
  FiBook,
  FiActivity,
  FiTrendingUp,
  FiClock,
  FiShield,
  FiRefreshCw,
  FiSettings,
  FiAlertCircle,
  FiCheckCircle,
  FiEdit3,
  FiTrash2,
  FiUserPlus,
} from "react-icons/fi";

const ACTION_META = {
  change_role: {
    label: "Changed Role",
    color: "bg-blue-100 text-blue-600",
    icon: <FiEdit3 size={13} />,
  },
  delete_user: {
    label: "Deleted User",
    color: "bg-rose-100 text-rose-600",
    icon: <FiTrash2 size={13} />,
  },
  delete_course: {
    label: "Deleted Course",
    color: "bg-rose-100 text-rose-600",
    icon: <FiTrash2 size={13} />,
  },
  enroll_student: {
    label: "Enrolled Student",
    color: "bg-emerald-100 text-emerald-600",
    icon: <FiUserPlus size={13} />,
  },
  remove_enrollment: {
    label: "Removed Enrollment",
    color: "bg-orange-100 text-orange-600",
    icon: <FiAlertCircle size={13} />,
  },
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchStats = () => {
    setLoading(true);
    api
      .get("/admin/stats")
      .then((r) => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="flex h-screen bg-[#F3F4F6] font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 h-64 relative px-10 pt-10">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
                <FiShield className="bg-white/10 p-1.5 rounded-lg" size={36} />
                Admin Dashboard
              </h1>
              <p className="text-slate-300 text-sm opacity-80">
                System overview — users, courses, and real-time activity
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchStats}
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition"
              >
                <FiRefreshCw size={15} /> Refresh
              </button>
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-3 text-white flex items-center gap-3">
                <FiClock size={18} />
                <span className="font-mono font-bold text-xl tracking-widest">
                  {currentTime.toLocaleTimeString("en-US", { hour12: false })}
                </span>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
        </div>

        <div className="px-10 -mt-24 relative z-10 grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <StatCard
            onClick={() => navigate("/admin/users")}
            icon={<FiUsers />}
            label="Total Users"
            value={stats?.total_users ?? "—"}
            sub={`${
              stats
                ? (stats.total_users || 0) -
                  (stats.total_teachers || 0) -
                  (stats.total_students || 0)
                : 0
            } admins · ${stats?.total_teachers ?? 0} teachers · ${stats?.total_students ?? 0} students`}
            gradient="from-blue-500 to-indigo-500"
            shadow="shadow-blue-200"
          />
          <StatCard
            onClick={() => navigate("/admin/courses")}
            icon={<FiBook />}
            label="Courses"
            value={stats?.total_courses ?? "—"}
            sub="across all teachers"
            gradient="from-violet-500 to-purple-500"
            shadow="shadow-violet-200"
          />
          <StatCard
            onClick={() => navigate("/admin/attendance-history")}
            icon={<FiCheckCircle />}
            label="Class Sessions"
            value={stats?.total_sessions ?? "—"}
            sub="total classes conducted"
            gradient="from-emerald-500 to-teal-400"
            shadow="shadow-emerald-200"
          />
        </div>
        <div className="px-10 pb-10 grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-3 bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <FiSettings size={16} className="text-slate-500" /> Recent Admin
                Actions
              </h2>
              <button
                onClick={() => navigate("/admin/logs")}
                className="text-xs text-blue-600 font-bold hover:underline"
              >
                View full log →
              </button>
            </div>
            {!stats?.recent_logs?.length ? (
              <p className="text-center text-gray-300 text-sm py-6">
                No actions recorded yet
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {stats.recent_logs.map((l) => {
                  const meta = ACTION_META[l.action] || {
                    label: l.action,
                    color: "bg-gray-100 text-gray-500",
                    icon: <FiAlertCircle size={13} />,
                  };
                  return (
                    <div
                      key={l.id}
                      className="flex items-start gap-3 p-4 rounded-2xl border border-gray-100 hover:bg-gray-50 transition"
                    >
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${meta.color}`}
                      >
                        {meta.icon}
                      </div>
                      <div className="min-w-0">
                        <span
                          className={`inline-block text-xs font-bold px-2 py-0.5 rounded mb-1 ${meta.color}`}
                        >
                          {meta.label}
                        </span>
                        <p className="text-xs text-gray-600 font-medium truncate">
                          {l.detail}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {l.admin_email?.split("@")[0]} ·{" "}
                          {new Date(l.timestamp).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, sub, gradient, shadow, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`cursor-pointer relative overflow-hidden rounded-2xl p-6 text-white shadow-xl ${shadow} bg-gradient-to-br ${gradient} transition-transform hover:scale-[1.02]`}
    >
      <div className="flex items-center gap-2 mb-3 opacity-90">
        <div className="p-2 bg-white/20 rounded-lg">{icon}</div>
        <span className="font-bold text-sm uppercase tracking-wide">
          {label}
        </span>
      </div>
      <h2 className="text-4xl font-extrabold tracking-tight">{value}</h2>
      <p className="text-white/70 text-xs mt-1 font-medium">{sub}</p>
    </div>
  );
}
