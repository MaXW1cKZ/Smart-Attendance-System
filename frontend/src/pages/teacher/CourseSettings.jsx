import React, { useState } from "react";
import Sidebar from "../../components/Sidebar";
import {
  FiSettings,
  FiSearch,
  FiFilter,
  FiEdit3,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiMoreHorizontal,
  FiChevronLeft,
  FiChevronRight
} from "react-icons/fi";

const CourseSettings = () => {
  // Mock Data: ข้อมูลการตั้งค่าของแต่ละวิชา
  const [settings, setSettings] = useState([
    { id: 1, name: "Intro to Computer Science", code: "CS101", period: "Mon 09:00-12:00", late_time: "09:15", absent_time: "10:00", max_score: 10 },
    { id: 2, name: "Software Engineering", code: "SE201", period: "Tue 13:00-16:00", late_time: "13:15", absent_time: "14:00", max_score: 10 },
    { id: 3, name: "Database Systems", code: "DB102", period: "Wed 09:00-12:00", late_time: "09:15", absent_time: "10:00", max_score: 10 },
    { id: 4, name: "Web Technology", code: "WT305", period: "Fri 13:00-16:00", late_time: "13:30", absent_time: "14:30", max_score: 15 },
  ]);

  return (
    <div className="flex h-screen bg-[#F3F4F6] font-sans">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        {/* --- 1. Header Section (Gradient Style เหมือน CreateCourse) --- */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-600 h-64 relative px-10 pt-10 pb-24">
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <FiSettings className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm" size={36} />
                Course Settings
              </h1>
              <p className="text-blue-100 opacity-90 pl-1">
                Configure attendance rules, late times, and scoring for your courses.
              </p>
            </div>
          </div>

          {/* Decorative Circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-20 w-32 h-32 bg-blue-500/30 rounded-full blur-2xl pointer-events-none"></div>
        </div>

        {/* --- 2. Floating Content Container --- */}
        <div className="px-10 -mt-20 pb-10 relative z-20">
          
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 min-h-[600px] flex flex-col">
            
            {/* Toolbar: Search & Filter */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
              <h2 className="text-xl font-bold text-gray-800">
                All Courses Configuration
              </h2>

              <div className="flex gap-3 w-full md:w-auto">
                <div className="relative group flex-1 md:flex-none">
                  <FiSearch className="absolute left-3 top-3 text-gray-400 group-focus-within:text-blue-500" />
                  <input 
                    type="text" 
                    placeholder="Search by course code..." 
                    className="w-full md:w-64 pl-10 pr-4 py-2.5 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm font-medium"
                  />
                </div>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 border border-transparent hover:border-gray-200 transition font-medium text-sm">
                  <FiFilter size={18} /> Filter
                </button>
              </div>
            </div>

            {/* Table Section */}
            <div className="overflow-x-auto flex-1">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    <th className="pb-4 pl-4">Course Name</th>
                    <th className="pb-4">Class Period</th>
                    <th className="pb-4 text-center">Late Time</th>
                    <th className="pb-4 text-center">Absent Time</th>
                    <th className="pb-4 text-center">Score / Class</th>
                    <th className="pb-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {settings.map((item) => (
                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/80 transition h-20 group">
                      {/* Course Name */}
                      <td className="pl-4">
                        <div className="flex flex-col">
                            <span className="font-bold text-gray-800 text-base">{item.name}</span>
                            <span className="text-xs font-semibold text-blue-500 bg-blue-50 w-max px-2 py-0.5 rounded mt-1">
                                {item.code}
                            </span>
                        </div>
                      </td>
                      
                      {/* Period */}
                      <td className="text-gray-500 font-medium">
                        <div className="flex items-center gap-2">
                            <FiClock className="text-gray-400" />
                            {item.period}
                        </div>
                      </td>

                      {/* Late Time */}
                      <td className="text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-50 text-orange-600 border border-orange-100">
                            <FiAlertCircle size={14} />
                            <span className="font-bold">{item.late_time}</span>
                        </div>
                      </td>

                      {/* Absent Time */}
                      <td className="text-center">
                         <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
                            <FiCheckCircle size={14} />
                            <span className="font-bold">{item.absent_time}</span>
                        </div>
                      </td>

                      {/* Score */}
                      <td className="text-center font-bold text-gray-700">
                        {item.max_score} pts
                      </td>

                      {/* Action Buttons */}
                      <td className="text-center">
                        <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <FiEdit3 size={18} />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors ml-1">
                            <FiMoreHorizontal size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination (Footer) */}
            <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-100">
               <span className="text-sm text-gray-400">Showing 4 of 12 courses</span>
               <div className="flex items-center gap-2">
                 <button className="w-9 h-9 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-400 disabled:opacity-50">
                    <FiChevronLeft />
                 </button>
                 <div className="flex items-center justify-center w-9 h-9 bg-blue-600 text-white rounded-lg shadow-md shadow-blue-200 text-sm font-bold">1</div>
                 <button className="w-9 h-9 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500">2</button>
                 <button className="w-9 h-9 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500">3</button>
                 <button className="w-9 h-9 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500">
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

export default CourseSettings;