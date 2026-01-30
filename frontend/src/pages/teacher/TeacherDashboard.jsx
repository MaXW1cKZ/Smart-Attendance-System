import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import {
  FiUsers,
  FiUserMinus, // ใช้แทน UserMinus
  FiClock,
  FiCalendar, // ใช้ตกแต่ง
  FiChevronDown, // ใช้สำหรับ Dropdown
  FiFilter
} from "react-icons/fi";

const TeacherDashboard = () => {
  // --- 1. Logic ส่วน Date Picker (เหมือน StudentDashboard) ---
  const [selectedDate, setSelectedDate] = useState(new Date());

  const formatDateDisplay = (date) => {
    return {
      day: date.getDate(),
      monthYear: date.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      weekday: date.toLocaleDateString("en-US", { weekday: "long" }),
    };
  };

  const { day, monthYear, weekday } = formatDateDisplay(selectedDate);

  const handleDateChange = (e) => {
    if(e.target.value) setSelectedDate(new Date(e.target.value));
  };

  const dateValue = selectedDate.toISOString().split('T')[0];

  return (
    <div className="flex h-screen bg-[#F3F4F6] font-sans">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        {/* --- Header Section (Design แบบ CreateCourse) --- */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-600 h-64 relative px-10 pt-10 pb-24">
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Real Time Report
              </h1>
              <p className="text-blue-100 opacity-90">
                Monitor student attendance and daily statistics.
              </p>
            </div>
          </div>

          {/* Decorative Circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-20 w-32 h-32 bg-blue-500/30 rounded-full blur-2xl pointer-events-none"></div>
        </div>

        {/* --- Floating Content Container --- */}
        <div className="px-10 -mt-24 pb-10 relative z-20 space-y-6">
          
          {/* 1. Filters Bar (Design ใหม่ให้เข้ากับ Theme) */}
          <div className="bg-white rounded-2xl p-5 shadow-lg shadow-blue-900/5 border border-gray-100 flex flex-wrap gap-6 justify-between items-center">
            
            {/* Date Picker Section */}
            <div className="relative flex items-center gap-3 group">
              <div className="bg-blue-50 p-3 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <FiCalendar size={24} />
              </div>
              <div className="relative">
                <input 
                  type="date"
                  value={dateValue}
                  onChange={handleDateChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                />
                <div className="flex flex-col">
                    <span className="text-sm text-gray-400 font-medium">Date Selected</span>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-gray-800">{day}</span>
                        <span className="text-sm font-semibold text-gray-600">{monthYear}</span>
                    </div>
                    <span className="text-xs text-gray-400">{weekday}</span>
                </div>
              </div>
            </div>

            {/* Divider (เส้นคั่น) */}
            <div className="hidden md:block h-12 w-px bg-gray-200"></div>

            {/* Subject Selector Section */}
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">
                Current Subject
              </label>
              <div className="relative">
                <select className="w-full appearance-none bg-gray-50 border border-transparent hover:bg-white hover:border-blue-200 text-gray-700 font-semibold py-3 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer">
                  <option>Live Subject</option>
                  <option>Intro to Computer Science</option>
                  <option>Software Engineering</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-400">
                  <FiChevronDown />
                </div>
              </div>
            </div>

            {/* Filter Button (Optional) */}
            <button className="p-3 bg-gray-100 text-gray-500 rounded-xl hover:bg-blue-600 hover:text-white transition-colors shadow-sm">
                <FiFilter size={20} />
            </button>
          </div>

          {/* 2. Stats Cards Grid (ใช้ Vibrant Style จาก StudentDashboard แต่ปรับ Container) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard 
              title="Attendance" 
              count={35} 
              colorType="green"
              subtitle="Students Present"
            />
            <StatCard 
              title="Absent" 
              count={5} 
              colorType="red" 
              subtitle="Missing Class"
            />
            <StatCard 
              title="Late" 
              count={3} 
              colorType="orange" 
              subtitle="Arrived Late"
            />
          </div>

        </div>
      </main>
    </div>
  );
};

// --- StatCard Component (Vibrant Style + React Icons) ---
const StatCard = ({ title, count, colorType, subtitle }) => {
  const styles = {
    green: {
      gradient: "from-emerald-500 to-teal-400",
      shadow: "shadow-emerald-200",
      icon: FiUsers
    },
    red: {
      gradient: "from-rose-500 to-pink-500",
      shadow: "shadow-rose-200",
      icon: FiUserMinus
    },
    orange: {
      gradient: "from-amber-400 to-orange-400",
      shadow: "shadow-orange-200",
      icon: FiClock
    }
  };

  const style = styles[colorType] || styles.green;
  const Icon = style.icon;

  return (
    <div className={`relative overflow-hidden rounded-2xl p-6 text-white shadow-xl ${style.shadow} bg-gradient-to-br ${style.gradient} transition-transform hover:scale-[1.02] duration-300 min-h-[160px]`}>
      
      {/* Background Icon (Watermark) */}
      <Icon className="absolute -right-4 -bottom-4 w-32 h-32 text-white opacity-20 transform rotate-12" />

      <div className="relative z-10 flex flex-col h-full justify-between">
        <div>
          <div className="flex items-center gap-2 mb-3 opacity-90">
             <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Icon size={18} />
             </div>
             <span className="font-bold text-sm tracking-wide uppercase">{title}</span>
          </div>
          <h2 className="text-5xl font-extrabold tracking-tight">{count}</h2>
          {subtitle && <p className="text-white/80 text-sm mt-1 font-medium">{subtitle}</p>}
        </div>

        <button className="mt-5 w-max px-4 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-lg text-xs font-bold transition border border-white/10 cursor-pointer flex items-center gap-1">
          See Details <FiChevronDown className="-rotate-90" />
        </button>
      </div>
    </div>
  );
};

export default TeacherDashboard;