import React, { useState } from "react";
import Sidebar from "../../components/Sidebar";
import {
  FiFileText,
  FiSearch,
  FiFilter,
  FiDownload,
  FiChevronLeft,
  FiChevronRight,
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiXCircle
} from "react-icons/fi";

const Stu_Attendance = () => {
  // Mock Data: จำลองข้อมูลการเข้าเรียนของนักเรียน
  const [records] = useState([
    { id: 1, course: "Smart Attendance AI", date: "12/12/2568", time: "09.00-12.00", email: "jane@microsoft.com", point: 1, maxPoint: 5, status: "Present" },
    { id: 2, course: "Smart Attendance AI", date: "19/11/2568", time: "09.00-12.00", email: "jane@microsoft.com", point: 1, maxPoint: 5, status: "Present" },
    { id: 3, course: "Smart Attendance AI", date: "26/10/2568", time: "09.00-12.00", email: "jane@microsoft.com", point: 0.5, maxPoint: 5, status: "Late" },
    { id: 4, course: "Smart Attendance AI", date: "02/09/2568", time: "09.00-12.00", email: "jane@microsoft.com", point: 1, maxPoint: 5, status: "Present" },
    { id: 5, course: "Smart Attendance AI", date: "12/08/2568", time: "09.00-12.00", email: "jane@microsoft.com", point: 0, maxPoint: 5, status: "Absent" },
    { id: 6, course: "Smart Attendance AI", date: "12/07/2568", time: "09.00-12.00", email: "jane@microsoft.com", point: 1, maxPoint: 5, status: "Present" },
    { id: 7, course: "Smart Attendance AI", date: "12/06/2568", time: "09.00-12.00", email: "jane@microsoft.com", point: 1, maxPoint: 5, status: "Present" },
    { id: 8, course: "Smart Attendance AI", date: "12/05/2568", time: "09.00-12.00", email: "jane@microsoft.com", point: 1, maxPoint: 5, status: "Present" },
  ]);

  // Helper สำหรับเลือกสี Badge ตามสถานะ (เพื่อความสวยงามเพิ่มเติมจากรูป)
  const getStatusColor = (status) => {
    switch (status) {
      case "Present": return "text-emerald-600 bg-emerald-50 border-emerald-100";
      case "Late": return "text-orange-600 bg-orange-50 border-orange-100";
      case "Absent": return "text-rose-600 bg-rose-50 border-rose-100";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="flex h-screen bg-[#F3F4F6] font-sans">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        {/* --- 1. Header Section (Gradient Theme) --- */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-600 h-64 relative px-10 pt-10 pb-24">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <FiFileText className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm" size={36} />
                Attendance Report
              </h1>
              <p className="text-blue-100 opacity-90 pl-1">
                Check your attendance history and points earned.
              </p>
            </div>

            {/* Dropdown เลือกวิชา (ตามตำแหน่งในรูปต้นฉบับ แต่ปรับดีไซน์) */}
            <div className="flex flex-col items-end">
                <label className="text-blue-100 text-xs font-semibold mb-1 mr-1">Choose Subject</label>
                <select className="bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:bg-white/20 cursor-pointer hover:bg-white/20 transition w-64 option:text-gray-800">
                    <option className="text-gray-800">Smart Attendance AI (09.00)</option>
                    <option className="text-gray-800">Software Engineering (13.00)</option>
                </select>
            </div>
          </div>

          {/* Decorative Circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-20 w-32 h-32 bg-blue-500/30 rounded-full blur-2xl pointer-events-none"></div>
        </div>

        {/* --- 2. Floating Content Container --- */}
        <div className="px-10 -mt-20 pb-10 relative z-20">
          
          <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 p-8 min-h-[600px] flex flex-col">
            
            {/* Header ภายใน Card (เลียนแบบรูปต้นฉบับ) */}
            <div className="flex flex-col md:flex-row justify-between items-end mb-8 border-b border-gray-100 pb-6 gap-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">
                        วิชา : <span className="text-blue-600">Smart Attendance AI</span>
                    </h2>
                    <p className="text-emerald-500 font-medium text-sm flex items-center gap-2 bg-emerald-50 w-max px-3 py-1 rounded-full">
                        <FiClock /> เวลา 09.00 - 12.00 (คาบเช้า)
                    </p>
                </div>

                {/* Search & Filter Toolbar */}
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative group flex-1 md:flex-none">
                        <FiSearch className="absolute left-3 top-3 text-gray-400 group-focus-within:text-blue-500" />
                        <input 
                            type="text" 
                            placeholder="Search..." 
                            className="w-full md:w-56 pl-10 pr-4 py-2.5 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm font-medium"
                        />
                    </div>
                    <div className="relative">
                         <select className="appearance-none bg-gray-50 hover:bg-gray-100 text-gray-600 pl-4 pr-10 py-2.5 rounded-xl border border-transparent focus:outline-none focus:border-blue-500 text-sm font-medium cursor-pointer transition-colors">
                            <option>Sort by: Newest</option>
                            <option>Sort by: Oldest</option>
                        </select>
                        <FiFilter className="absolute right-3 top-3 text-gray-400 pointer-events-none" size={14}/>
                    </div>
                    <button className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition border border-transparent hover:border-blue-100" title="Export">
                        <FiDownload size={20}/>
                    </button>
                </div>
            </div>

            {/* Table Section */}
            <div className="overflow-x-auto flex-1">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    <th className="pb-4 pl-4 w-16">No.</th>
                    <th className="pb-4">Course Name</th>
                    <th className="pb-4">Date</th>
                    <th className="pb-4">Time</th>
                    <th className="pb-4">Email</th>
                    <th className="pb-4 text-center">Status (Points)</th>
                    <th className="pb-4 text-center">Max Point</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {records.map((item, index) => (
                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/80 transition h-16 group">
                      <td className="pl-4 text-gray-400 font-medium">{index + 1}</td>
                      
                      {/* Course Name */}
                      <td className="font-bold text-gray-700">{item.course}</td>
                      
                      {/* Date */}
                      <td className="text-gray-600 font-medium">
                        <div className="flex items-center gap-2">
                             <FiCalendar className="text-gray-300" size={14}/> {item.date}
                        </div>
                      </td>
                      
                      {/* Time */}
                      <td className="text-gray-500 font-mono text-xs">{item.time}</td>
                      
                      {/* Email */}
                      <td className="text-gray-500">{item.email}</td>
                      
                      {/* Point Earn / Status (ปรับให้สวยกว่า Text ธรรมดา) */}
                      <td className="text-center">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border ${getStatusColor(item.status)}`}>
                            {item.status === "Present" && <FiCheckCircle size={14} />}
                            {item.status === "Late" && <FiAlertCircle size={14} />}
                            {item.status === "Absent" && <FiXCircle size={14} />}
                            <span className="font-bold">{item.point}</span>
                            <span className="text-xs opacity-75">({item.status})</span>
                        </div>
                      </td>

                      {/* Max Point */}
                      <td className="text-center font-bold text-gray-400">
                        {item.maxPoint}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination (ตามแบบต้นฉบับ) */}
            <div className="flex justify-center items-center mt-8 pt-4">
               <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl">
                 <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white text-gray-400 disabled:opacity-50 transition shadow-sm">
                    <FiChevronLeft />
                 </button>
                 <button className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-lg shadow-md shadow-blue-200 text-sm font-bold">1</button>
                 <button className="w-8 h-8 flex items-center justify-center hover:bg-white text-gray-500 rounded-lg text-sm font-medium transition hover:shadow-sm">2</button>
                 <button className="w-8 h-8 flex items-center justify-center hover:bg-white text-gray-500 rounded-lg text-sm font-medium transition hover:shadow-sm">3</button>
                 <button className="w-8 h-8 flex items-center justify-center hover:bg-white text-gray-500 rounded-lg text-sm font-medium transition hover:shadow-sm">4</button>
                 <span className="text-gray-400 px-1">...</span>
                 <button className="w-8 h-8 flex items-center justify-center hover:bg-white text-gray-500 rounded-lg text-sm font-medium transition hover:shadow-sm">8</button>
                 <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white text-gray-400 transition shadow-sm">
                    <FiChevronRight />
                 </button>
               </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default Stu_Attendance;