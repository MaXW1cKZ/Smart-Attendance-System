import React, { useState, useEffect } from "react"; // ✅ เพิ่ม useEffect
import Sidebar from "../../components/Sidebar";
import {
  FiUsers,
  FiUserMinus,
  FiClock,
  FiCalendar,
  FiChevronDown,
  FiFilter,
  FiCheckCircle,
  FiActivity
} from "react-icons/fi";

const StudentDashboard = () => {
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

  // --- 2. Logic ส่วน Real-time Clock (เพิ่มใหม่) ---
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // อัปเดตทุก 1 วินาที

    return () => clearInterval(timer); // เคลียร์เมื่อปิดหน้า
  }, []);

  // ฟอร์แมตเวลาเป็น HH:mm:ss
  const timeString = currentTime.toLocaleTimeString('en-US', {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });

  return (
    <div className="flex h-screen bg-[#F3F4F6] font-sans">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        {/* --- Header Section --- */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-600 h-64 relative px-10 pt-10 pb-24">
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Real Time Report
              </h1>
              <p className="text-blue-100 opacity-90">
                Welcome back! Check your attendance status and history.
              </p>
            </div>

            {/* ✅ ส่วนแสดงเวลา (Digital Clock) */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl shadow-lg flex flex-col items-end">
               <div className="text-2xl font-mono font-bold text-white tracking-widest drop-shadow-sm">
                  {timeString}
               </div>
               <div className="text-blue-100 text-xs font-bold uppercase tracking-wider mt-1 flex items-center gap-1">
                  <FiClock size={12}/> Current Time
               </div>
            </div>
          </div>

          {/* Decorative Circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-20 w-32 h-32 bg-blue-500/30 rounded-full blur-2xl pointer-events-none"></div>
        </div>

        {/* --- Floating Content Container --- */}
        <div className="px-10 -mt-24 pb-10 relative z-20 space-y-6">
          
          {/* 1. Filters Bar */}
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

            {/* Divider */}
            <div className="hidden md:block h-12 w-px bg-gray-200"></div>

            {/* Subject Selector */}
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">
                Filter by Subject
              </label>
              <div className="relative">
                <select className="w-full appearance-none bg-gray-50 border border-transparent hover:bg-white hover:border-blue-200 text-gray-700 font-semibold py-3 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer">
                  <option>All Subjects</option>
                  <option>Intro to Computer Science</option>
                  <option>Software Engineering</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-400">
                  <FiChevronDown />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Stats Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard 
              title="My Attendance" 
              count="85%" 
              colorType="green"
              subtitle="Total Presence Rate"
              icon={FiCheckCircle}
            />
            <StatCard 
              title="Classes Missed" 
              count={2} 
              colorType="red" 
              subtitle="Need to catch up"
              icon={FiUserMinus}
            />
            <StatCard 
              title="Late Arrivals" 
              count={3} 
              colorType="orange" 
              subtitle="Be punctual next time"
              icon={FiClock}
            />
          </div>

          {/* 3. Recent Activity Section */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <FiActivity className="text-blue-500"/> Recent Activity
                </h2>
                <button className="text-sm text-blue-600 font-semibold hover:underline">View All</button>
            </div>
            
            {/* Table Mockup */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-400 uppercase bg-gray-50/50">
                        <tr>
                            <th className="px-4 py-3 rounded-l-lg">Date</th>
                            <th className="px-4 py-3">Subject</th>
                            <th className="px-4 py-3">Time In</th>
                            <th className="px-4 py-3 rounded-r-lg text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        <tr className="hover:bg-gray-50/50 transition">
                            <td className="px-4 py-4 font-medium text-gray-700">Today</td>
                            <td className="px-4 py-4 text-gray-600">Intro to Computer Science</td>
                            <td className="px-4 py-4 font-mono text-gray-500">08:55 AM</td>
                            <td className="px-4 py-4 text-center">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                                    Present
                                </span>
                            </td>
                        </tr>
                        <tr className="hover:bg-gray-50/50 transition">
                            <td className="px-4 py-4 font-medium text-gray-700">Yesterday</td>
                            <td className="px-4 py-4 text-gray-600">Software Engineering</td>
                            <td className="px-4 py-4 font-mono text-gray-500">09:15 AM</td>
                            <td className="px-4 py-4 text-center">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
                                    Late
                                </span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

// --- StatCard Component ---
const StatCard = ({ title, count, colorType, subtitle, icon: Icon }) => {
  const styles = {
    green: {
      gradient: "from-emerald-500 to-teal-400",
      shadow: "shadow-emerald-200",
    },
    red: {
      gradient: "from-rose-500 to-pink-500",
      shadow: "shadow-rose-200",
    },
    orange: {
      gradient: "from-amber-400 to-orange-400",
      shadow: "shadow-orange-200",
    }
  };

  const style = styles[colorType] || styles.green;

  return (
    <div className={`relative overflow-hidden rounded-2xl p-6 text-white shadow-xl ${style.shadow} bg-gradient-to-br ${style.gradient} transition-transform hover:scale-[1.02] duration-300 min-h-[160px]`}>
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
      </div>
    </div>
  );
};

export default StudentDashboard;