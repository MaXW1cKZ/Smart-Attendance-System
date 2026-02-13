import React, { useState } from "react";
import Sidebar from "../../components/Sidebar";
import {
  FiFileText,
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiChevronDown,
  FiFilter,
  FiDownload,
  FiAlertCircle,
  FiPieChart
} from "react-icons/fi";

const Stu_Attendance = () => {
  // Mock Data: รายวิชาที่นักเรียนลงทะเบียน
  const [subjects] = useState([
    { id: 1, code: "CS101", name: "Smart Attendance AI", section: "1" },
    { id: 2, code: "SE201", name: "Software Engineering", section: "2" },
    { id: 3, code: "DB102", name: "Database Systems", section: "1" },
  ]);

  const [selectedSubject, setSelectedSubject] = useState(subjects[0].name);

  // Mock Data: ประวัติการเข้าเรียน (เฉพาะวิชาที่เลือก)
  const [records] = useState([
    { id: 1, date: "12/02/2026", time: "09:00", room: "M22", status: "Present", point: 1 },
    { id: 2, date: "05/02/2026", time: "09:15", room: "M22", status: "Late", point: 0.5 },
    { id: 3, date: "29/01/2026", time: "09:00", room: "M22", status: "Present", point: 1 },
    { id: 4, date: "22/01/2026", time: "-", room: "-", status: "Absent", point: 0 },
    { id: 5, date: "15/01/2026", time: "08:55", room: "M22", status: "Present", point: 1 },
    { id: 6, date: "08/01/2026", time: "09:00", room: "M22", status: "Present", point: 1 },
  ]);

  // Helper เลือกสี Badge
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
        {/* --- 1. Header Section (Theme สีน้ำเงินเหมือน Teacher) --- */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-600 h-64 relative px-10 pt-10 pb-24">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <FiFileText className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm" size={36} />
              My Attendance
            </h1>
            <p className="text-blue-100 opacity-90 pl-1">
              Check your attendance history and points for each subject.
            </p>
          </div>

          {/* Decorative Circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-20 w-32 h-32 bg-blue-500/30 rounded-full blur-2xl pointer-events-none"></div>
        </div>

        {/* --- 2. Content Container --- */}
        <div className="px-10 -mt-20 pb-10 relative z-20">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 min-h-[600px] flex flex-col">
            
            {/* --- Toolbar Layout (เหมือน Teacher เป๊ะๆ) --- */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-6 border-b border-gray-100 pb-6">
                
                {/* 🟢 ฝั่งซ้าย: เลือกวิชา (Select Subject) */}
                <div className="flex flex-col gap-2 w-full xl:w-auto">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Select Subject</label>
                    <div className="relative">
                        {/* Dropdown ตัวใหญ่ */}
                        <select 
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                            className="appearance-none bg-blue-50 hover:bg-blue-100 text-blue-900 text-lg font-bold pl-4 pr-12 py-3 rounded-xl border border-blue-100 focus:outline-none focus:ring-4 focus:ring-blue-500/20 cursor-pointer transition-all w-full xl:min-w-[350px]"
                        >
                            {subjects.map((subj) => (
                                <option key={subj.id} value={subj.name}>
                                    {subj.code}: {subj.name}
                                </option>
                            ))}
                        </select>
                        <FiChevronDown className="absolute right-4 top-4 text-blue-600 pointer-events-none" size={20}/>
                    </div>
                    {/* ข้อมูลเสริมของวิชา */}
                    <p className="text-gray-500 text-sm flex items-center gap-2 ml-1">
                        <FiPieChart size={14}/> Your Total Points: <span className="font-bold text-green-600">4.5 / 5.0</span>
                    </p>
                </div>

                {/* 🔵 ฝั่งขวา: เครื่องมือ (Filter / Export) */}
                <div className="flex flex-wrap items-end gap-3 w-full xl:w-auto">
                    
                    {/* Date Filter */}
                    <div className="relative">
                        <div className="absolute left-3 top-3.5 text-gray-400 pointer-events-none">
                            <FiCalendar size={18} />
                        </div>
                        <select className="appearance-none h-[46px] bg-gray-50 hover:bg-gray-100 text-gray-600 pl-10 pr-10 rounded-xl border border-transparent focus:outline-none focus:border-blue-500 text-sm font-medium cursor-pointer transition-colors">
                            <option>All Semesters</option>
                            <option>This Month</option>
                            <option>Last Month</option>
                        </select>
                        <FiFilter className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" size={16}/>
                    </div>

                    {/* Export */}
                    <button className="h-[46px] flex items-center gap-2 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-200 transition-all font-bold text-sm">
                        <FiDownload size={18}/> <span>Export CSV</span>
                    </button>
                </div>
            </div>

            {/* --- Table Section --- */}
            <div className="overflow-x-auto flex-1">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    <th className="pb-4 pl-4 w-16">No.</th>
                    <th className="pb-4">Date</th>
                    <th className="pb-4 text-center">Time</th>
                    <th className="pb-4 text-center">Room</th>
                    <th className="pb-4 text-center">Status</th>
                    <th className="pb-4 text-center">Points</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {records.map((item, index) => (
                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/80 transition h-16 group">
                      <td className="pl-4 text-gray-400 font-medium">{index + 1}</td>
                      
                      {/* Date */}
                      <td className="font-bold text-gray-700">
                        <div className="flex items-center gap-2">
                             <FiCalendar className="text-gray-400"/> {item.date}
                        </div>
                      </td>
                      
                      {/* Time */}
                      <td className="text-center font-medium text-gray-600">
                        {item.time === "-" ? "-" : item.time}
                      </td>

                      {/* Room */}
                      <td className="text-center text-gray-500 font-mono">
                        {item.room}
                      </td>
                      
                      {/* Status Badge */}
                      <td className="text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadge(item.status)}`}>
                            {item.status === "Present" && <FiCheckCircle className="mr-1" />}
                            {item.status === "Late" && <FiAlertCircle className="mr-1" />}
                            {item.status === "Absent" && <FiXCircle className="mr-1" />}
                            {item.status}
                        </span>
                      </td>

                      {/* Points */}
                      <td className="text-center font-bold text-gray-800 text-lg">
                        {item.point}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary Footer */}
            <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center text-gray-500 text-sm">
               <p>Showing recent attendance records for <span className="font-bold text-blue-600">{selectedSubject}</span></p>
               <div className="flex gap-4 mt-2 md:mt-0">
                   <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Present: 4</span>
                   <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-500"></div> Late: 1</span>
                   <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500"></div> Absent: 1</span>
               </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default Stu_Attendance;