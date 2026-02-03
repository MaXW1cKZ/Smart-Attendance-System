import React, { useState } from "react";
import Sidebar from "../../components/Sidebar";
import {
  FiSearch,
  FiUserPlus,
  FiFilter,
  FiMoreVertical,
  FiEdit,
  FiTrash2,
  FiShield,
  FiCheckCircle,
  FiXCircle
} from "react-icons/fi";

const UserManagement = () => {
  // Mock Data
  const [users] = useState([
    { id: 1, name: "Supachai Maneerat", email: "supachai@kmitl.ac.th", role: "teacher", status: "Active", lastLogin: "2 mins ago" },
    { id: 2, name: "Kelly Pond", email: "kellypond@gmail.com", role: "admin", status: "Active", lastLogin: "Online" },
    { id: 3, name: "Student A", email: "student.a@kmitl.ac.th", role: "student", status: "Inactive", lastLogin: "2 days ago" },
    { id: 4, name: "Teacher B", email: "teacher.b@kmitl.ac.th", role: "teacher", status: "Active", lastLogin: "1 hour ago" },
    { id: 5, name: "Student C", email: "student.c@kmitl.ac.th", role: "student", status: "Suspended", lastLogin: "1 week ago" },
  ]);

  // Helper เลือกสี Badge ตาม Role
  const getRoleBadge = (role) => {
    switch (role) {
      case "admin": return "bg-purple-100 text-purple-700 border-purple-200";
      case "teacher": return "bg-blue-100 text-blue-700 border-blue-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="flex h-screen bg-[#F3F4F6] font-sans">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        {/* Header: Dark Slate Theme (เหมือน Admin Dashboard) */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 h-64 relative px-10 pt-10 pb-24">
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <FiShield className="bg-white/10 p-1.5 rounded-lg backdrop-blur-sm" size={36} />
                User Management
              </h1>
              <p className="text-slate-300 opacity-90 pl-1">
                Manage accounts, permissions, and status.
              </p>
            </div>
            <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-blue-900/20 transition-all font-semibold">
              <FiUserPlus size={20} /> Add New User
            </button>
          </div>
          
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-20 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
        </div>

        {/* Floating Content */}
        <div className="px-10 -mt-20 pb-10 relative z-20">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 min-h-[600px] flex flex-col">
            
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
              <div className="flex gap-2">
                 <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg font-medium text-sm hover:bg-gray-200 transition">All Users</button>
                 <button className="px-4 py-2 bg-white text-gray-500 rounded-lg font-medium text-sm hover:bg-gray-50 border border-transparent hover:border-gray-200 transition">Teachers</button>
                 <button className="px-4 py-2 bg-white text-gray-500 rounded-lg font-medium text-sm hover:bg-gray-50 border border-transparent hover:border-gray-200 transition">Students</button>
              </div>

              <div className="flex gap-3 w-full md:w-auto">
                <div className="relative group flex-1 md:flex-none">
                  <FiSearch className="absolute left-3 top-3 text-gray-400 group-focus-within:text-blue-600" />
                  <input 
                    type="text" 
                    placeholder="Search users..." 
                    className="w-full md:w-64 pl-10 pr-4 py-2.5 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all text-sm font-medium"
                  />
                </div>
                <button className="p-2.5 bg-gray-50 text-gray-500 rounded-xl hover:bg-gray-100 border border-transparent hover:border-gray-200 transition">
                  <FiFilter size={20} />
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto flex-1">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    <th className="pb-4 pl-4">User Info</th>
                    <th className="pb-4">Role</th>
                    <th className="pb-4">Status</th>
                    <th className="pb-4">Last Login</th>
                    <th className="pb-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50/80 transition h-20 group">
                      <td className="pl-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                                {user.name.charAt(0)}
                            </div>
                            <div>
                                <div className="font-bold text-gray-800">{user.name}</div>
                                <div className="text-xs text-gray-500">{user.email}</div>
                            </div>
                        </div>
                      </td>
                      <td>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getRoleBadge(user.role)} capitalize`}>
                            {user.role}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                            {user.status === "Active" ? <FiCheckCircle className="text-green-500"/> : <FiXCircle className="text-red-500"/>}
                            <span className={`font-medium ${user.status === "Active" ? "text-green-700" : "text-gray-500"}`}>{user.status}</span>
                        </div>
                      </td>
                      <td className="text-gray-500 font-medium">{user.lastLogin}</td>
                      <td className="text-center">
                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit">
                                <FiEdit size={16} />
                            </button>
                            <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete">
                                <FiTrash2 size={16} />
                            </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default UserManagement;