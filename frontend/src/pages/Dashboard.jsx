import React from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // ลบ Token ทิ้ง
    localStorage.removeItem('token');
    // ดีดกลับไปหน้า Login
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Dashboard 🏠</h1>
        <p className="text-gray-600 mb-8">
          ยินดีต้อนรับ! คุณเข้าสู่ระบบสำเร็จแล้ว (นี่คือพื้นที่ส่วนบุคคล)
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h3 className="font-bold text-blue-700">ลงเวลาเรียน</h3>
            <p className="text-sm text-gray-500">เช็คชื่อด้วยใบหน้า</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <h3 className="font-bold text-green-700">ประวัติการเข้าเรียน</h3>
            <p className="text-sm text-gray-500">ดูสถิติย้อนหลัง</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
            <h3 className="font-bold text-purple-700">รายวิชา</h3>
            <p className="text-sm text-gray-500">จัดการวิชาเรียน</p>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg transition"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Dashboard;