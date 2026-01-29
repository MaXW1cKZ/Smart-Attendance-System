import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from "../../components/Sidebar"; // ปรับ path ตามจริง
import { FiSave, FiX, FiBookOpen, FiLayers, FiCalendar } from "react-icons/fi";

const CreateCourse = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // State เก็บข้อมูลฟอร์ม
  const [formData, setFormData] = useState({
    course_code: "",
    name: "",
    description: "",
    semester: "1",
    academic_year: new Date().getFullYear().toString(), // Default ปีปัจจุบัน
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      // ⚠️ ยิงไปที่ Backend (เช็ค Port ให้ตรง)
      await axios.post("http://localhost:8000/courses/", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("สร้างรายวิชาสำเร็จ! (Course Created)");
      navigate("/dashboard"); // หรือพาไปหน้าหน้ารายวิชาทั้งหมด
    } catch (error) {
      console.error("Create course failed", error);
      alert(
        "เกิดข้อผิดพลาด: " + (error.response?.data?.detail || "Unknown Error"),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto flex justify-center">
        <div className="w-full max-w-3xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800">
              สร้างรายวิชาใหม่
            </h1>
            <p className="text-gray-500 mt-2">
              กรอกข้อมูลเพื่อเปิดรายวิชาสำหรับการเช็คชื่อ
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Row 1: รหัสวิชา & ชื่อวิชา */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    รหัสวิชา (Course Code)
                  </label>
                  <div className="relative">
                    <FiLayers className="absolute left-3 top-3.5 text-gray-400" />
                    <input
                      type="text"
                      name="course_code"
                      required
                      placeholder="e.g. CS101"
                      value={formData.course_code}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    ชื่อวิชา (Course Name)
                  </label>
                  <div className="relative">
                    <FiBookOpen className="absolute left-3 top-3.5 text-gray-400" />
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="e.g. Introduction to Computer Vision"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: รายละเอียด */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  รายละเอียด (Description)
                </label>
                <textarea
                  name="description"
                  rows="4"
                  placeholder="คำอธิบายรายวิชา..."
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none"
                ></textarea>
              </div>

              {/* Row 3: เทอม & ปีการศึกษา */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    ภาคการศึกษา (Semester)
                  </label>
                  <select
                    name="semester"
                    value={formData.semester}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none bg-white"
                  >
                    <option value="1">ภาคเรียนที่ 1</option>
                    <option value="2">ภาคเรียนที่ 2</option>
                    <option value="Summer">ภาคฤดูร้อน (Summer)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    ปีการศึกษา (Academic Year)
                  </label>
                  <div className="relative">
                    <FiCalendar className="absolute left-3 top-3.5 text-gray-400" />
                    <input
                      type="number"
                      name="academic_year"
                      required
                      value={formData.academic_year}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-6 border-t border-gray-50 mt-6">
                <button
                  type="button"
                  onClick={() => navigate("/dashboard")}
                  className="flex-1 py-3 rounded-xl font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                >
                  <FiX /> ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    "กำลังบันทึก..."
                  ) : (
                    <>
                      <FiSave /> สร้างวิชา
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreateCourse;
