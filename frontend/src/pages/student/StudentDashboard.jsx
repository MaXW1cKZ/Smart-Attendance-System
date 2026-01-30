// src/pages/Dashboard.jsx
import React, { useState } from "react";
import { Users, UserMinus, Clock8 } from 'lucide-react';
import Sidebar from "../../components/Sidebar";

const Dashboard = () => {
  // --- 1. Logic ส่วน Date Picker ---
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

  // --- 2. ส่วน Render หน้าจอ ---
  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <Sidebar />

      <main className="flex-1 p-10 overflow-y-auto">
        <h2 className="text-3xl font-bold text-navy-900 mb-10">
          Real Time Report
        </h2>

        {/* Filters Bar */}
        <div className="flex flex-wrap gap-4 justify-between items-center mb-10">
          
          {/* Date Picker */}
          <div className="relative bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2 w-64 group hover:border-blue-400 transition-colors">
            <input 
              type="date"
              value={dateValue}
              onChange={handleDateChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
            />
            <span className="text-4xl text-gray-400 font-light min-w-[3rem] text-center group-hover:text-blue-500 transition-colors">
              {day}
            </span>
            <div className="flex flex-col">
              <span className="text-xs text-gray-600 font-semibold">{monthYear}</span>
              <span className="text-xs text-gray-400">{weekday}</span>
            </div>
            <span className="ml-auto text-xs text-gray-400">▼</span>
          </div>

          {/* Subject Selector */}
          <div className="flex flex-col">
            <label className="text-xs text-gray-400 mb-1 ml-1">Choose Subject</label>
            <div className="bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between w-64 cursor-pointer">
              <span className="text-sm text-gray-600">Live Subject</span>
              <span className="text-xs text-gray-400">▼</span>
            </div>
          </div>
        </div>

        {/* Stats Cards Grid (Vibrant Glass) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title="Attendance" 
            count={35} 
            colorType="green" 
          />
          <StatCard 
            title="Absent" 
            count={5} 
            colorType="red" 
          />
          <StatCard 
            title="Late" 
            count={3} 
            colorType="orange" 
          />
        </div>
      </main>
    </div>
  );
};

// --- Component ย่อย: StatCard แบบ Vibrant ---
const StatCard = ({ title, count, colorType }) => {
  const styles = {
    green: {
      gradient: "from-emerald-500 to-teal-400",
      shadow: "shadow-emerald-200",
      icon: Users
    },
    red: {
      gradient: "from-rose-500 to-pink-500",
      shadow: "shadow-rose-200",
      icon: UserMinus
    },
    orange: {
      gradient: "from-amber-400 to-orange-400",
      shadow: "shadow-orange-200",
      icon: Clock8
    }
  };

  const style = styles[colorType] || styles.green;
  const Icon = style.icon;

  return (
    <div className={`relative overflow-hidden rounded-2xl p-6 text-white shadow-xl ${style.shadow} bg-gradient-to-br ${style.gradient} transition-transform hover:scale-105 duration-300 min-h-[160px]`}>
      
      {/* Background Icon (Watermark) */}
      <Icon className="absolute -right-4 -bottom-4 w-32 h-32 text-white opacity-20 transform rotate-12" />

      <div className="relative z-10 flex flex-col h-full justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2 opacity-90">
             <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                <Icon size={16} />
             </div>
             <span className="font-medium text-sm tracking-wide">{title}</span>
          </div>
          <h2 className="text-5xl font-bold tracking-tight">{count}</h2>
        </div>

        <button className="mt-4 w-max px-4 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-xs font-semibold transition border border-white/10 cursor-pointer">
          See Details ›
        </button>
      </div>
    </div>
  );
};

export default Dashboard;