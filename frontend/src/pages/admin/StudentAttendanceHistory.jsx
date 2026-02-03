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
  FiXCircle,
  FiUser
} from "react-icons/fi";

const StudentAttendanceHistory = () => {
  // Mock Data: จำลองข้อมูลประวัติการเข้าเรียนของนักเรียนคนหนึ่ง
  const [records] = useState([
    { id: 1, course: "Smart Attendance AI", date: "12/12/2568", time: "09.00-12.00", point: 1, maxPoint: 5, status: "Present" },
    { id: 2, course: "Software Engineering", date: "11/12/2568", time: "13.00-16.00", point: 1, maxPoint: 5, status: "Present" },
    { id: 3, course: "Smart Attendance AI", date: "05/12/2568", time: "09.00-12.00", point: 0.5, maxPoint: 5, status: "Late" },
    { id: 4, course: "Database Systems", date: "04/12/2568", time: "09.00-12.00", point: 0, maxPoint: 5, status: "Absent" },
    { id: 5, course: "Smart Attendance AI", date: "28/11/2568", time: "09.00-12.00", point: 1, maxPoint: 5, status: "Present" },
    { id: 6, course: "Web Technology", date: "27/11/2568", time: "13.00-16.00", point: 1, maxPoint: 5, status: "Present" },
    { id: 7, course: "Smart Attendance AI", date: "21/11/2568", time: "09.00-12.00", point: 0.5, maxPoint: 5, status: "Late" },
    { id: 8, course: "Software Engineering", date: "20/11/2568", time: "13.00-16.00", point: 1, maxPoint: 5, status: "Present" },
  ]);

  // Helper เลือกสี Badge
  const getStatusBadge = (status) => {
    switch (status) {
      case "Present": return "text-emerald-600 bg-emerald-50 border-emerald-200";
      case "Late": return "text-orange-600 bg-orange-50 border-orange-200";
      case "Absent": return "text-rose-600 bg-rose-50 border-rose-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="flex h-screen bg-[#F3F4F6] font-sans">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        {/* --- Header Theme Admin (Slate Gradient) --- */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 h-64 relative px-10 pt-10 pb-24">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <FiFileText className="bg-white/10 p-1.5 rounded-lg backdrop-blur-sm" size={36} />
                Student Attendance History
              </h1>
              <p className="text-slate-300 opacity-90 pl-1">
                Viewing attendance logs for a specific student.
              </p>
            </div>

            {/* Dropdown เลือกนักเรียน (จำลองว่า Admin เลือกดูคนนี้อยู่) */}
            <div className="flex flex-col items-end">
                <label className="text-slate-300 text-xs font-semibold mb-1 mr-1 flex items-center gap-1">
                    <FiUser /> Viewing Student:
                </label>
                <select className="bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:bg-white/20 cursor-pointer hover:bg-white/20 transition w-64 option:text-gray-800 font-semibold">
                    <option className="text-gray-800" value="1">Supachai Maneerat (65070282)</option>
                    <option className="text-gray-800" value="2">Kelly Pond (65070283)</option>
                </select>
            </div>
          </div>
          
          {/* Decorative Circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-20 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
        </div>

        {/* --- Floating Content Container --- */}
        <div className="px-10 -mt-20 pb-10 relative z-20">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 min-h-[600px] flex flex-col">
            
            {/* Toolbar Section */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                {/* หัวข้อสรุป (ตามรูปต้นฉบับ) */}
                <div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">
                        ประวัติการเข้าเรียนรวมทุกวิชา
                    </h2>
                    <p className="text-blue-600 font-medium text-sm flex items-center gap-2 bg-blue-50 w-max px-3 py-1 rounded-full border border-blue-100">
                        <FiCheckCircle /> เข้าเรียนแล้ว 85% (ขาด 2 ครั้ง)
                    </p>
                </div>

                {/* Tools: Search, Filter, Export */}
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative group flex-1 md:flex-none">
                        <FiSearch className="absolute left-3 top-3 text-gray-400 group-focus-within:text-blue-600" />
                        <input 
                            type="text" 
                            placeholder="Search course or date..." 
                            className="w-full md:w-56 pl-10 pr-4 py-2.5 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all text-sm font-medium"
                        />
                    </div>
                    <div className="relative">
                         <select className="appearance-none bg-gray-50 hover:bg-gray-100 text-gray-600 pl-4 pr-10 py-2.5 rounded-xl border border-transparent focus:outline-none focus:border-blue-600 text-sm font-medium cursor-pointer transition-colors">
                            <option>Newest First</option>
                            <option>Oldest First</option>
                            <option>Status: Absent</option>
                        </select>
                        <FiFilter className="absolute right-3 top-3 text-gray-400 pointer-events-none" size={14}/>
                    </div>
                    <button className="p-2.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition border border-transparent hover:border-blue-100 bg-gray-50" title="Export CSV">
                        <FiDownload size={20}/>
                    </button>
                </div>
            </div>

            {/* Table Section (โครงสร้างคอลัมน์ตามรูปต้นฉบับ) */}
            <div className="overflow-x-auto flex-1">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    <th className="pb-4 pl-4 w-16">No.</th>
                    <th className="pb-4">Course Name</th>
                    <th className="pb-4">Date</th>
                    <th className="pb-4">Time</th>
                    {/* ผมตัด Email ออกเพราะเราดูของคนๆ เดียวอยู่แล้ว ใส่ Status แทนจะดูง่ายกว่าครับ */}
                    <th className="pb-4 text-center">Status / Point</th>
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
                             <FiCalendar className="text-gray-400" size={14}/> {item.date}
                        </div>
                      </td>
                      
                      {/* Time */}
                      <td className="text-gray-500 font-medium text-xs flex items-center gap-2 mt-4">
                         <FiClock size={12}/> {item.time}
                      </td>
                      
                      {/* Status / Point Badge */}
                      <td className="text-center">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border ${getStatusBadge(item.status)}`}>
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

            {/* Pagination (ตามสไตล์ Admin) */}
            <div className="flex justify-end items-center mt-8 gap-2 border-t border-gray-50 pt-6">
                 <span className="text-sm text-gray-400 mr-4">Page 1 of 3</span>
                 <button className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg text-gray-400 hover:bg-gray-200 text-sm transition"><FiChevronLeft/></button>
                 <button className="w-8 h-8 flex items-center justify-center bg-blue-600 rounded-lg text-white text-sm font-bold shadow-sm transition">1</button>
                 <button className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 rounded-lg text-gray-500 text-sm transition">2</button>
                 <button className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 rounded-lg text-gray-500 text-sm transition">3</button>
                 <button className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg text-gray-400 hover:bg-gray-200 text-sm transition"><FiChevronRight/></button>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentAttendanceHistory;