// src/pages/admin/AdminDashboard.jsx
import React from "react";
import Sidebar from "../../components/Sidebar";
import {
  FiUsers,
  FiBook,
  FiServer,
  FiActivity,
  FiCpu,
  FiDatabase
} from "react-icons/fi";

const AdminDashboard = () => {
  return (
    <div className="flex h-screen bg-[#F3F4F6] font-sans">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        {/* --- Header Section --- */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 h-64 relative px-10 pt-10 pb-24">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
               <FiServer className="bg-white/10 p-1.5 rounded-lg backdrop-blur-sm" size={36} />
               Admin Console
            </h1>
            <p className="text-slate-300 opacity-90 pl-1">
               System overview and user management control panel.
            </p>
          </div>
          
          {/* Decorative Circles (เปลี่ยนสีให้ดูดุขึ้นนิดนึงสมกับ Admin) */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-20 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
        </div>

        {/* --- Floating Content Container --- */}
        <div className="px-10 -mt-20 pb-10 relative z-20 space-y-8">
          
          {/* 1. System Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard 
              title="Total Users" 
              count="1,240" 
              subtitle="Students & Teachers"
              icon={FiUsers}
              colorType="blue"
            />
            <StatCard 
              title="Active Courses" 
              count="42" 
              subtitle="This Semester"
              icon={FiBook}
              colorType="purple"
            />
            <StatCard 
              title="System Health" 
              count="98%" 
              subtitle="Server Uptime"
              icon={FiActivity}
              colorType="green"
            />
          </div>

          {/* 2. Server Status (Mockup) */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
             <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <FiCpu className="text-blue-600"/> Server Status
             </h2>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* CPU Usage */}
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <span className="font-semibold text-gray-600">CPU Usage</span>
                        <span className="text-green-600 font-bold bg-green-100 px-2 py-1 rounded text-xs">Normal</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                        <div className="bg-blue-600 h-4 rounded-full" style={{ width: '45%' }}></div>
                    </div>
                    <p className="text-right text-sm text-gray-500">45% Used</p>
                </div>

                {/* Storage */}
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <span className="font-semibold text-gray-600">Database Storage</span>
                        <span className="text-orange-600 font-bold bg-orange-100 px-2 py-1 rounded text-xs flex items-center gap-1">
                             <FiDatabase size={10}/> SQL
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                        <div className="bg-indigo-600 h-4 rounded-full" style={{ width: '72%' }}></div>
                    </div>
                    <p className="text-right text-sm text-gray-500">72% Used (140GB / 200GB)</p>
                </div>
             </div>
          </div>

        </div>
      </main>
    </div>
  );
};

// Component ย่อย
const StatCard = ({ title, count, colorType, subtitle, icon: Icon }) => {
  const styles = {
    blue: { gradient: "from-blue-600 to-indigo-600", shadow: "shadow-blue-200" },
    purple: { gradient: "from-purple-600 to-fuchsia-600", shadow: "shadow-purple-200" },
    green: { gradient: "from-emerald-500 to-teal-500", shadow: "shadow-emerald-200" },
  };
  const style = styles[colorType] || styles.blue;

  return (
    <div className={`relative overflow-hidden rounded-2xl p-6 text-white shadow-xl ${style.shadow} bg-gradient-to-br ${style.gradient} transition-transform hover:-translate-y-1`}>
      <Icon className="absolute -right-4 -bottom-4 w-32 h-32 text-white opacity-10 transform rotate-12" />
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3 opacity-90">
             <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm"><Icon size={18} /></div>
             <span className="font-bold text-sm tracking-wide uppercase">{title}</span>
        </div>
        <h2 className="text-4xl font-bold tracking-tight">{count}</h2>
        <p className="text-white/80 text-sm mt-1">{subtitle}</p>
      </div>
    </div>
  );
};

export default AdminDashboard;