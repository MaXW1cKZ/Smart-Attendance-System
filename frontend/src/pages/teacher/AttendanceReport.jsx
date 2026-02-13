import React, { useState } from "react";
import Sidebar from "../../components/Sidebar";
import {
  FiSearch,
  FiDownload,
  FiFilter,
  FiFileText,
  FiChevronLeft,
  FiChevronRight,
  FiEdit,
  FiMoreHorizontal,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiChevronDown
} from "react-icons/fi";

const AttendanceReport = () => {
  // Mock Data
  const [records] = useState([
    { id: 1, name: "Jane Cooper", studentId: "65070282", time: "08:55", email: "jane@example.com", point: 1, status: "Present" },
    { id: 2, name: "Floyd Miles", studentId: "65070283", time: "09:10", email: "floyd@example.com", point: 0.5, status: "Late" },
    { id: 3, name: "Ronald Richards", studentId: "65070284", time: "09:15", email: "ronald@example.com", point: 0.5, status: "Late" },
    { id: 4, name: "Marvin McKinney", studentId: "65070285", time: "08:50", email: "marvin@example.com", point: 1, status: "Present" },
    { id: 5, name: "Jerome Bell", studentId: "65070286", time: "-", email: "jerome@example.com", point: 0, status: "Absent" },
    { id: 6, name: "Kathryn Murphy", studentId: "65070287", time: "08:58", email: "kathryn@example.com", point: 1, status: "Present" },
    { id: 7, name: "Jacob Jones", studentId: "65070288", time: "09:00", email: "jacob@example.com", point: 1, status: "Present" },
    { id: 8, name: "Kristin Watson", studentId: "65070289", time: "09:20", email: "kristin@example.com", point: 0.5, status: "Late" },
  ]);

  // Helper สี Badge
  const getStatusBadge = (status) => {
    switch (status) {
      case "Present": return "bg-emerald-100 text-emerald-600 border-emerald-200";
      case "Late": return "bg-orange-100 text-orange-600 border-orange-200";
      case "Absent": return "bg-rose-100 text-rose-600 border-rose-200";
      default: return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  return (
    <div className="flex h-screen bg-[#F3F4F6] font-sans">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-600 h-64 relative px-10 pt-10 pb-24">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <FiFileText className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm" size={36} />
                Attendance Report
            </h1>
            <p className="text-blue-100 opacity-90 pl-1">
                View and export detailed student attendance records.
            </p>
          </div>
          {/* Decorative Circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-20 w-32 h-32 bg-blue-500/30 rounded-full blur-2xl pointer-events-none"></div>
        </div>

        {/* Content Container */}
        <div className="px-10 -mt-20 pb-10 relative z-20">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 min-h-[600px] flex flex-col">
            
            {/* --- Toolbar Layout ใหม่ --- */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-6 border-b border-gray-100 pb-6">
                
                {/* 🟢 ฝั่งซ้าย: เลือกวิชา (Primary Context) */}
                <div className="flex flex-col gap-2 w-full xl:w-auto">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Select Class</label>
                    <div className="relative">
                        {/* Dropdown แบบเน้นให้ดูเหมือนหัวข้อ */}
                        <select className="appearance-none bg-blue-50 hover:bg-blue-100 text-blue-900 text-lg font-bold pl-4 pr-12 py-3 rounded-xl border border-blue-100 focus:outline-none focus:ring-4 focus:ring-blue-500/20 cursor-pointer transition-all w-full xl:min-w-[300px]">
                            <option>Smart Attendance AI</option>
                            <option>Software Engineering</option>
                            <option>Database Systems</option>
                        </select>
                        <FiChevronDown className="absolute right-4 top-4 text-blue-600 pointer-events-none" size={20}/>
                    </div>
                    {/* Time Info */}
                    <p className="text-gray-500 text-sm flex items-center gap-2 ml-1">
                        <FiClock size={14}/> Monday 09:00 - 12:00 (Morning Session)
                    </p>
                </div>

                {/* 🔵 ฝั่งขวา: เครื่องมือ (Search / Sort / Export) */}
                <div className="flex flex-wrap items-end gap-3 w-full xl:w-auto">
                    
                    {/* Search (ขยายเต็มที่) */}
                    <div className="relative group flex-grow">
                        <FiSearch className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-blue-500" />
                        <input 
                            type="text" 
                            placeholder="Search student..." 
                            className="w-full xl:w-64 pl-10 pr-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm font-medium"
                        />
                    </div>
                    
                    {/* Sort */}
                    <div className="relative">
                        <select className="appearance-none h-[46px] bg-gray-50 hover:bg-gray-100 text-gray-600 pl-4 pr-10 rounded-xl border border-transparent focus:outline-none focus:border-blue-500 text-sm font-medium cursor-pointer transition-colors">
                            <option>Sort by: ID</option>
                            <option>Sort by: Name</option>
                            <option>Sort by: Status</option>
                        </select>
                        <FiFilter className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" size={16}/>
                    </div>

                    {/* Export */}
                    <button className="h-[46px] flex items-center gap-2 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-200 transition-all font-bold text-sm">
                        <FiDownload size={18}/> <span>Export CSV</span>
                    </button>
                </div>
            </div>

            {/* Table Section (เหมือนเดิม) */}
            <div className="overflow-x-auto flex-1">
              <table className="w-full min-w-[1000px]">
                <thead>
                  <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    <th className="pb-4 pl-4 w-16">#</th>
                    <th className="pb-4">Student Name</th>
                    <th className="pb-4">ID Number</th>
                    <th className="pb-4 text-center">Check-in Time</th>
                    <th className="pb-4">Email</th>
                    <th className="pb-4 text-center">Point</th>
                    <th className="pb-4 text-center">Status</th>
                    <th className="pb-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {records.map((item, index) => (
                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/80 transition h-16 group">
                      <td className="pl-4 text-gray-400 font-medium">{index + 1}</td>
                      <td>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                                {item.name.charAt(0)}
                            </div>
                            <span className="font-bold text-gray-700">{item.name}</span>
                        </div>
                      </td>
                      <td className="text-gray-500 font-mono">{item.studentId}</td>
                      <td className="text-center font-medium text-gray-700">
                        {item.time === "-" ? <span className="text-gray-300">-</span> : item.time}
                      </td>
                      <td className="text-gray-500">{item.email}</td>
                      <td className="text-center font-bold text-gray-700">{item.point}</td>
                      <td className="text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadge(item.status)}`}>
                            {item.status === "Present" && <FiCheckCircle className="mr-1" />}
                            {item.status === "Late" && <FiClock className="mr-1" />}
                            {item.status === "Absent" && <FiXCircle className="mr-1" />}
                            {item.status}
                        </span>
                      </td>
                      <td className="text-center">
                        <button className="text-gray-400 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-colors">
                            <FiEdit size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination (เหมือนเดิม) */}
            <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-100">
               <span className="text-sm text-gray-400">Showing 1-8 of 45 students</span>
               <div className="flex items-center gap-2">
                 <button className="w-9 h-9 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-400 disabled:opacity-50"><FiChevronLeft /></button>
                 <div className="flex items-center justify-center w-9 h-9 bg-blue-600 text-white rounded-lg shadow-md shadow-blue-200 text-sm font-bold">1</div>
                 <button className="w-9 h-9 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500">2</button>
                 <button className="w-9 h-9 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500"><FiChevronRight /></button>
               </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default AttendanceReport;