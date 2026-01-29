// src/pages/Dashboard.jsx
import React from "react";
import Sidebar from "../../components/Sidebar"; // ✅ Import Sidebar มาใช้

const Dashboard = () => {
  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* ✅ เรียกใช้ Sidebar บรรทัดเดียวจบ */}
      <Sidebar />

      {/* --- Main Content --- */}
      <main className="flex-1 p-10 overflow-y-auto">
        <h2 className="text-3xl font-bold text-navy-900 mb-10">
          Real Time Report
        </h2>

        {/* Filters Bar */}
        <div className="flex flex-wrap gap-4 justify-between items-center mb-10">
          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2 cursor-pointer w-64">
            <span className="text-4xl text-gray-300 font-light">14</span>
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 font-semibold">
                December 2026
              </span>
              <span className="text-xs text-gray-400">Monday</span>
            </div>
            <span className="ml-auto text-xs text-gray-400">▼</span>
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-gray-400 mb-1 ml-1">
              Choose Subject
            </label>
            <div className="bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between w-64 cursor-pointer">
              <span className="text-sm text-gray-600">Live Subject</span>
              <span className="text-xs text-gray-400">▼</span>
            </div>
          </div>
        </div>

        {/* Stats Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <StatCard
            title="Attendance"
            count="35"
            color="green"
            bgColor="bg-green-50"
            circleColor="bg-white border-green-100"
          />
          <StatCard
            title="Absent"
            count="5"
            color="red"
            bgColor="bg-red-50"
            circleColor="bg-white border-red-100"
          />
          <StatCard
            title="Late"
            count="3"
            color="orange"
            bgColor="bg-orange-50"
            circleColor="bg-white border-orange-100"
          />
        </div>
      </main>
    </div>
  );
};

const StatCard = ({ title, count, bgColor, circleColor }) => (
  <div
    className={`${bgColor} rounded-3xl p-6 flex flex-col items-center shadow-sm hover:shadow-md transition-shadow duration-300 min-h-[280px] justify-between`}
  >
    <div
      className={`w-32 h-32 rounded-full ${circleColor} border-8 flex items-center justify-center mt-4`}
    >
      <span className="text-4xl font-bold text-gray-800">{count}</span>
    </div>
    <div className="text-center mt-4">
      <h3 className="text-gray-700 font-semibold mb-6">{title}</h3>
      <button className="bg-white/80 hover:bg-white text-gray-600 text-xs font-bold py-2 px-8 rounded-full shadow-sm transition">
        LIST
      </button>
    </div>
  </div>
);

export default Dashboard;
