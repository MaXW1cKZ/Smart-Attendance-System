import React, { useState } from "react";
import Sidebar from "../../components/Sidebar";
import {
  FiSettings,
  FiSave,
  FiBell,
  FiLock,
  FiMonitor,
  FiToggleLeft,
  FiToggleRight
} from "react-icons/fi";

const SystemSettings = () => {
  // Mock State
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    emailNotifications: true,
    autoBackup: true,
    lateThreshold: "15",
  });

  const toggle = (key) => {
    setSettings({ ...settings, [key]: !settings[key] });
  };

  return (
    <div className="flex h-screen bg-[#F3F4F6] font-sans">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        {/* Header: Dark Slate Theme */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 h-64 relative px-10 pt-10 pb-24">
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <FiSettings className="bg-white/10 p-1.5 rounded-lg backdrop-blur-sm" size={36} />
                System Settings
              </h1>
              <p className="text-slate-300 opacity-90 pl-1">
                Configure global application preferences.
              </p>
            </div>
            <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl shadow-lg shadow-blue-900/20 transition-all font-semibold">
              <FiSave size={20} /> Save Changes
            </button>
          </div>
          
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-20 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
        </div>

        {/* Floating Content */}
        <div className="px-10 -mt-20 pb-10 relative z-20 space-y-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* 1. General Settings */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
               <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                 <FiMonitor className="text-blue-600"/> General Settings
               </h3>
               
               <div className="space-y-6">
                 <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div>
                        <p className="font-bold text-gray-700">Maintenance Mode</p>
                        <p className="text-xs text-gray-500">Disable access for all users except admins.</p>
                    </div>
                    <button onClick={() => toggle('maintenanceMode')} className={`text-3xl transition-colors ${settings.maintenanceMode ? "text-blue-600" : "text-gray-300"}`}>
                        {settings.maintenanceMode ? <FiToggleRight/> : <FiToggleLeft/>}
                    </button>
                 </div>

                 <div>
                    <label className="text-sm font-bold text-gray-600 mb-2 block">System Name</label>
                    <input type="text" defaultValue="Smart Attendance AI" className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:border-blue-500 outline-none transition font-semibold text-gray-700"/>
                 </div>

                 <div>
                    <label className="text-sm font-bold text-gray-600 mb-2 block">Default Late Threshold (Minutes)</label>
                    <input type="number" value={settings.lateThreshold} className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:border-blue-500 outline-none transition font-semibold text-gray-700"/>
                 </div>
               </div>
            </div>

            {/* 2. Security & Notifications */}
            <div className="space-y-8">
                {/* Security */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                    <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <FiLock className="text-purple-600"/> Security
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                             <span className="font-medium text-gray-700">Force Two-Factor Auth</span>
                             <button className="text-3xl text-gray-300"><FiToggleLeft/></button>
                        </div>
                        <div className="flex items-center justify-between">
                             <span className="font-medium text-gray-700">Allow Guest Login</span>
                             <button className="text-3xl text-gray-300"><FiToggleLeft/></button>
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                    <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <FiBell className="text-orange-600"/> Notifications
                    </h3>
                    <div className="space-y-4">
                         <div className="flex items-center justify-between">
                             <span className="font-medium text-gray-700">Email Alerts</span>
                             <button onClick={() => toggle('emailNotifications')} className={`text-3xl transition-colors ${settings.emailNotifications ? "text-blue-600" : "text-gray-300"}`}>
                                {settings.emailNotifications ? <FiToggleRight/> : <FiToggleLeft/>}
                            </button>
                        </div>
                        <div className="flex items-center justify-between">
                             <span className="font-medium text-gray-700">System Auto-Backup</span>
                             <button onClick={() => toggle('autoBackup')} className={`text-3xl transition-colors ${settings.autoBackup ? "text-blue-600" : "text-gray-300"}`}>
                                {settings.autoBackup ? <FiToggleRight/> : <FiToggleLeft/>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default SystemSettings;