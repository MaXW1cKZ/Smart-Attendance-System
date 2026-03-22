import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import { FiArrowLeft, FiSearch, FiUsers, FiTrash2 } from "react-icons/fi";

const EnrolledStudents = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `http://localhost:8000/courses/${courseId}/students`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setStudents(response.data);
      } catch (error) {
        console.error("Error fetching students:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [courseId]);

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.student_id.toString().includes(searchTerm),
  );

  return (
    <div className="flex h-screen bg-[#F3F4F6] font-sans">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        {/* Gradient Header */}
        <div className="bg-gradient-to-r from-blue-700 to-slate-900 h-64 relative px-10 pt-10 pb-24">
          <div className="relative z-10">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-blue-200 hover:text-white font-semibold mb-5 transition-colors text-sm"
            >
              <FiArrowLeft size={18} /> Back to Course Settings
            </button>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <FiUsers
                className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm"
                size={36}
              />
              Enrolled Students
            </h1>
            <p className="text-blue-100 opacity-90 pl-1">
              Total {students.length} student(s) enrolled in this course.
            </p>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none"></div>
        </div>

        {/* Floating Content Container */}
        <div className="px-10 -mt-20 pb-10 relative z-20">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 min-h-[600px] flex flex-col">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
              <h2 className="text-xl font-bold text-gray-800">Student List</h2>
              <div className="flex gap-3 w-full md:w-auto">
                <div className="relative group flex-1 md:flex-none">
                  <FiSearch className="absolute left-3 top-3 text-gray-400 group-focus-within:text-blue-500" />
                  <input
                    type="text"
                    placeholder="Search by ID or name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full md:w-64 pl-10 pr-4 py-2.5 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-blue-500 transition-all text-sm font-medium outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto flex-1">
              {loading ? (
                <div className="flex justify-center items-center h-64 text-gray-400 font-medium">
                  Loading students...
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="flex justify-center items-center h-64 text-gray-400 font-medium">
                  No students found.
                </div>
              ) : (
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                      <th className="pb-4 pl-4 w-16 text-center">No.</th>
                      <th className="pb-4 pl-4">Student ID</th>
                      <th className="pb-4">Name</th>
                      <th className="pb-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {filteredStudents.map((student, index) => (
                      <tr
                        key={student.id}
                        className="border-b border-gray-50 hover:bg-gray-50/80 transition h-16"
                      >
                        <td className="pl-4 text-center font-medium text-gray-400">
                          {index + 1}
                        </td>
                        <td className="pl-4 font-bold text-gray-600">
                          {student.student_id}
                        </td>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                              {student.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-bold text-gray-900">
                              {student.name}
                            </span>
                          </div>
                        </td>
                        <td className="text-center">
                          <button
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove Student"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EnrolledStudents;
