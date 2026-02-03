import React, { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import {
  FiActivity,
  FiCalendar,
  FiChevronDown,
  FiUsers,
  FiUserMinus,
  FiClock,
  FiMonitor,
  FiRefreshCw
} from "react-icons/fi";

const AdminRealTimeReport = () => {
  // Mock Data: สถิติของวิชาที่เลือก
  const [stats, setStats] = useState({
    attendance: 45,
    absent: 3,
    late: 5
  });

  // State สำหรับนาฬิกา
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = currentTime.toLocaleTimeString('en-US', { hour12: false, hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex h-screen bg-[#F3F4F6] font-sans">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        {/* --- Header: Admin Theme (Slate Gradient) --- */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 h-64 relative px-10 pt-10 pb-24">
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <FiMonitor className="bg-white/10 p-1.5 rounded-lg backdrop-blur-sm" size={36} />
                Real Time Monitoring
              </h1>
              <p className="text-slate-300 opacity-90 pl-1">
                Live attendance tracking for active classes.
              </p>
            </div>

            {/* Live Clock Badge */}
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-xl backdrop-blur-md animate-pulse">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="font-mono font-bold">LIVE {timeString}</span>
            </div>
          </div>
          
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-20 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
        </div>

        {/* --- Floating Content --- */}
        <div className="px-10 -mt-24 pb-10 relative z-20 space-y-6">
          
          {/* 1. Control Bar (ตัวเลือกวิชา + วันที่) */}
          <div className="bg-white rounded-2xl p-6 shadow-lg shadow-slate-900/5 border border-gray-100 flex flex-col md:flex-row gap-6 justify-between items-center">
            
            {/* Left: Date Picker (Style ตามรูป) */}
            <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="bg-gray-50 p-3 rounded-xl text-gray-400">
                    <FiCalendar size={24}/>
                </div>
                <div className="relative group">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Select Date</label>
                    <input 
                        type="date" 
                        className="font-bold text-gray-700 bg-transparent border-none p-0 focus:ring-0 text-lg cursor-pointer" 
                        defaultValue={new Date().toISOString().split('T')[0]}
                    />
                </div>
            </div>

            {/* Divider */}
            <div className="hidden md:block h-12 w-px bg-gray-200"></div>

            {/* Right: Class Selector (Admin ต้องเลือกวิชาที่จะส่อง) */}
            <div className="w-full md:flex-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Select Active Class to Monitor</label>
                <div className="relative">
                    <select className="w-full appearance-none bg-blue-50 border border-blue-100 text-blue-800 font-bold text-lg py-3 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer hover:bg-blue-100 transition">
                        <option>🔴 CS101: Intro to CS (Prof. Supachai) - Room M22</option>
                        <option>🟡 SE201: Software Eng (Dr. Kelly) - Room M12</option>
                        <option>🟢 DB102: Database Sys (Prof. Smith) - Lab 4</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-blue-600">
                         <FiChevronDown size={24}/>
                    </div>
                </div>
            </div>

            {/* Refresh Button */}
            <button className="p-4 bg-gray-100 text-gray-500 rounded-xl hover:bg-blue-600 hover:text-white transition shadow-sm" title="Refresh Data">
                <FiRefreshCw size={20} />
            </button>
          </div>

          {/* 2. Big Stat Cards (ตามรูป Reference เป๊ะๆ) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             {/* Attendance (Green) */}
             <BigStatCard 
                title="Attendance"
                count={stats.attendance}
                color="text-emerald-600"
                bg="bg-emerald-50"
                border="border-emerald-100"
                icon={<FiUsers size={32}/>}
             />
             
             {/* Absent (Red) */}
             <BigStatCard 
                title="Absent"
                count={stats.absent}
                color="text-rose-600"
                bg="bg-rose-50"
                border="border-rose-100"
                icon={<FiUserMinus size={32}/>}
             />

             {/* Late (Orange) */}
             <BigStatCard 
                title="Late"
                count={stats.late}
                color="text-orange-600"
                bg="bg-orange-50"
                border="border-orange-100"
                icon={<FiClock size={32}/>}
             />
          </div>

          {/* 3. Detail List (Optional - ใส่เพิ่มเพื่อให้ Admin เห็นรายชื่อเด็กด้วย) */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-800">Student Logs</h3>
                <span className="text-sm text-gray-400">Showing recent activity</span>
             </div>
             {/* (Table Code ถ้าต้องการใส่เพิ่ม) */}
             <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                Select a class above to view detailed student list.
             </div>
          </div>

        </div>
      </main>
    </div>
  );
};

// Component การ์ดใหญ่ (Design ตามรูป image_394ad1.jpg)
const BigStatCard = ({ title, count, color, bg, border, icon }) => {
    return (
        <div className={`bg-white rounded-3xl p-8 shadow-xl shadow-gray-200/50 border ${border} flex flex-col items-center justify-center min-h-[280px] relative overflow-hidden group hover:-translate-y-2 transition-transform duration-300`}>
            
            {/* Background Blob decoration */}
            <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${title === 'Attendance' ? 'from-emerald-400 to-teal-500' : title === 'Absent' ? 'from-rose-400 to-pink-500' : 'from-amber-400 to-orange-500'}`}></div>
            
            {/* Circle Container */}
            <div className={`w-40 h-40 rounded-full ${bg} flex items-center justify-center mb-6 relative z-10 group-hover:scale-110 transition-transform duration-500`}>
                <span className={`text-6xl font-bold ${color}`}>{count}</span>
            </div>

            {/* Label */}
            <h3 className="text-xl font-bold text-gray-700 uppercase tracking-widest">{title}</h3>
            
            {/* Icon Decoration (Faded) */}
            <div className={`absolute -bottom-6 -right-6 opacity-10 ${color} transform rotate-12`}>
                {React.cloneElement(icon, { size: 120 })}
            </div>
        </div>
    );
};

export default AdminRealTimeReport;