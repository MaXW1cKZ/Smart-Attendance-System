import React, { useState } from "react";
import api from "../../api/axios";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import {
  FiPlusCircle,
  FiSearch,
  FiCheckCircle,
  FiAlertCircle,
  FiArrowRight,
  FiCalendar,
} from "react-icons/fi";

const StudentEnroll = () => {
  const navigate = useNavigate();
  const [courseCode, setCourseCode] = useState("");
  const [courseInfo, setCourseInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState("");

  const handleSearchCourse = async () => {
    const trimmed = courseCode.trim();
    if (!trimmed) return;
    setLoading(true);
    setError("");
    setCourseInfo(null);
    try {
      const res = await api.get(`/courses/search/${trimmed}`);
      setCourseInfo(res.data);
    } catch (err) {
      setError(
        err.response?.status === 404
          ? "Course not found. Please check the code and try again."
          : "Search failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    setEnrolling(true);
    setError("");
    try {
      await api.post("/courses/enroll", { course_code: courseCode.trim() });
      navigate("/student/dashboard", {
        state: { message: `Successfully enrolled in ${courseInfo?.name}!` },
      });
    } catch (err) {
      setError(
        err.response?.data?.detail || "Enrollment failed. Please try again.",
      );
      setEnrolling(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#F3F4F6] font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 h-64 relative px-10 pt-10">
          <div className="relative z-10 text-white">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <FiPlusCircle size={32} /> Join New Course
            </h1>
            <p className="text-indigo-100 opacity-90">
              Enter the course code provided by your instructor.
            </p>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
        </div>

        <div className="px-10 -mt-20 pb-10 relative z-20">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
              <div className="mb-8 text-center">
                <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FiSearch size={40} />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Ready to learn?
                </h2>
                <p className="text-gray-500">
                  Search for your subject to register
                </p>
              </div>

              <div className="flex gap-3 mb-6">
                <input
                  type="text"
                  placeholder="Enter Course Code (e.g. CS101)"
                  value={courseCode}
                  onChange={(e) => {
                    setCourseCode(e.target.value);
                    setCourseInfo(null);
                    setError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleSearchCourse()}
                  className="flex-1 px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-xl tracking-widest text-gray-700 outline-none"
                />
                <button
                  onClick={handleSearchCourse}
                  disabled={loading || !courseCode.trim()}
                  className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <FiSearch size={18} />
                  )}
                  Search
                </button>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-rose-500 bg-rose-50 border border-rose-100 p-4 rounded-xl mb-6">
                  <FiAlertCircle />
                  <span className="font-semibold text-sm">{error}</span>
                </div>
              )}

              {courseInfo && (
                <div className="bg-gray-50 rounded-2xl p-6 border border-dashed border-indigo-200">
                  <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-3">
                    Course Found
                  </p>
                  <div className="flex justify-between items-start mb-5 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-indigo-100 text-indigo-600 text-xs font-black px-2 py-0.5 rounded">
                          {courseInfo.course_code}
                        </span>
                        <span className="text-xs text-gray-400 font-semibold">
                          Section {courseInfo.section}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-800">
                        {courseInfo.name}
                      </h3>
                      <p className="text-gray-500 text-sm flex items-center gap-1.5 mt-1">
                        <FiCalendar size={13} />
                        {courseInfo.day_of_week}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-gray-400 font-bold uppercase mb-1">
                        Instructor
                      </p>
                      <div className="flex items-center gap-2 justify-end">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                          {courseInfo.teacher_name?.charAt(0) || "T"}
                        </div>
                        <span className="font-semibold text-gray-700 text-sm">
                          {courseInfo.teacher_name}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-emerald-100 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {enrolling ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Enrolling...
                      </>
                    ) : (
                      <>
                        <FiCheckCircle size={20} /> Confirm Enrollment{" "}
                        <FiArrowRight size={18} />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentEnroll;
