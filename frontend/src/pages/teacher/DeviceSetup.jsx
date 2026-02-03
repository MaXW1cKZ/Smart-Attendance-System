import React, { useState } from "react";
import Sidebar from "../../components/Sidebar";
import {
  FiMapPin,
  FiBook,
  FiCalendar,
  FiMonitor,
  FiPlay,
  FiCheck,
  FiSettings,
  FiChevronDown
} from "react-icons/fi";

const DeviceSetup = () => {
  // Mock State สำหรับการเลือกค่าต่างๆ
  const [config, setConfig] = useState({
    room: "M22",
    course: "Smart Attendance AI",
    date: new Date().toISOString().split('T')[0], // วันที่ปัจจุบัน YYYY-MM-DD
    device: "Raspie WebCam"
  });

  return (
    <div className="flex h-screen bg-[#F3F4F6] font-sans">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        {/* --- 1. Header Section (Gradient Style) --- */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-600 h-64 relative px-10 pt-10 pb-24">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <FiSettings className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm" size={36} />
              System Configuration
            </h1>
            <p className="text-blue-100 opacity-90 pl-1">
              Setup your classroom environment before starting the session.
            </p>
          </div>

          {/* Decorative Circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-20 w-32 h-32 bg-blue-500/30 rounded-full blur-2xl pointer-events-none"></div>
        </div>

        {/* --- 2. Floating Content Container --- */}
        <div className="px-10 -mt-20 pb-10 relative z-20">
          
          <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 p-8 md:p-12 max-w-4xl mx-auto flex flex-col relative overflow-hidden">
            
            {/* Decorative Top Line */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>

            <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-800">Setup Wizard</h2>
                <p className="text-gray-500 text-sm">Complete these 4 steps to initialize the AI system.</p>
            </div>

            {/* --- Setup Grid --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* 1. Choose Room */}
              <SelectionCard 
                label="Step 1: Room"
                value={config.room}
                icon={<FiMapPin size={24}/>}
                color="text-rose-600"
                bgColor="bg-rose-50"
                borderColor="group-hover:border-rose-200"
              />

              {/* 2. Choose Course */}
              <SelectionCard 
                label="Step 2: Course"
                value={config.course}
                icon={<FiBook size={24}/>}
                color="text-blue-600"
                bgColor="bg-blue-50"
                borderColor="group-hover:border-blue-200"
              />

              {/* 3. Choose Date */}
              <SelectionCard 
                label="Step 3: Date"
                value={config.date} // แสดงวันที่
                icon={<FiCalendar size={24}/>}
                color="text-amber-600"
                bgColor="bg-amber-50"
                borderColor="group-hover:border-amber-200"
                inputType="date"
                onChange={(e) => setConfig({...config, date: e.target.value})}
              />

              {/* 4. Choose Device */}
              <SelectionCard 
                label="Step 4: Camera Source"
                value={config.device}
                icon={<FiMonitor size={24}/>}
                color="text-indigo-600"
                bgColor="bg-indigo-50"
                borderColor="group-hover:border-indigo-200"
              />

            </div>

            {/* --- Action Button --- */}
            <div className="mt-10 pt-8 border-t border-gray-100 flex justify-end items-center gap-4">
                <p className="text-sm text-gray-400 hidden md:block">
                   <FiCheck className="inline mr-1 text-green-500"/> 
                   All systems ready
                </p>
                <button className="px-8 py-3.5 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 hover:-translate-y-1 transition-all duration-300 flex items-center gap-2.5">
                    Start Session <FiPlay size={18} className="fill-current"/>
                </button>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

// --- Sub-Component: Selection Card ---
const SelectionCard = ({ label, value, icon, color, bgColor, borderColor, inputType = "text", onChange }) => {
  return (
    <div className={`group relative p-5 rounded-2xl border border-gray-100 bg-white hover:shadow-md transition-all cursor-pointer ${borderColor} border-l-4 border-l-transparent hover:border-l-current`}>
        <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
                {/* Icon Box */}
                <div className={`w-12 h-12 rounded-xl ${bgColor} ${color} flex items-center justify-center shrink-0 transition-transform group-hover:scale-110`}>
                    {icon}
                </div>
                
                {/* Text Content */}
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</span>
                    {inputType === "date" ? (
                        <input 
                            type="date" 
                            value={value} 
                            onChange={onChange}
                            className="font-bold text-gray-800 text-lg bg-transparent border-none p-0 focus:ring-0 cursor-pointer"
                        />
                    ) : (
                        <span className="font-bold text-gray-800 text-lg group-hover:text-blue-700 transition-colors">
                            {value}
                        </span>
                    )}
                </div>
            </div>

            {/* Arrow Icon */}
            <div className="text-gray-300 group-hover:text-gray-500 transition-colors pt-2">
                <FiChevronDown size={20} />
            </div>
        </div>
    </div>
  );
};

export default DeviceSetup;