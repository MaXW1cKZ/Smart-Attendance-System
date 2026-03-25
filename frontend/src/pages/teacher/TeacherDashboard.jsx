import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../api/axios";
import Sidebar from "../../components/Sidebar";
import {
  FiBook,
  FiClock,
  FiChevronDown,
  FiCheckCircle,
  FiActivity,
  FiBarChart2,
  FiPlay,
  FiTrendingUp,
  FiUsers,
  FiXCircle,
} from "react-icons/fi";

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const successMsg = location.state?.message || null;

  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [thisWeekSessions, setThisWeekSessions] = useState(0);
  const [thisWeekCourses, setThisWeekCourses] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    api
      .get("/courses/my-courses")
      .then((r) => setCourses(r.data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (courses.length === 0) return;
    const fetchThisWeekStats = async () => {
      try {
        const res = await Promise.all(
          courses.map((c) => api.get(`/courses/${c.id}/sessions`)),
        );
        let sCount = 0;
        const cSet = new Set();

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        res.forEach((r, idx) => {
          r.data.forEach((session) => {
            if (session.actual_start_time) {
              const sDate = new Date(session.actual_start_time);
              if (sDate >= sevenDaysAgo) {
                sCount++;
                cSet.add(courses[idx].id);
              }
            }
          });
        });

        setThisWeekSessions(sCount);
        setThisWeekCourses(cSet.size);
      } catch (err) {
        console.error("Failed to fetch weekly stats", err);
      }
    };
    fetchThisWeekStats();
  }, [courses]);

  useEffect(() => {
    if (!selectedCourse) {
      setReportData(null);
      return;
    }
    setLoadingReport(true);
    setReportData(null);
    api
      .get(`/courses/${selectedCourse.id}/overall-report`)
      .then((r) => setReportData(r.data))
      .catch(console.error)
      .finally(() => setLoadingReport(false));
  }, [selectedCourse]);

  let courseAttendancePct = null;
  let totalStudents = 0;
  let totalP = 0,
    totalL = 0,
    totalA = 0;

  if (reportData && reportData.records) {
    totalStudents = reportData.records.length;
    reportData.records.forEach((r) => {
      totalP += r.present || 0;
      totalL += r.late || 0;
      totalA += r.absent || 0;
    });
    const totalClasses = totalP + totalL + totalA;
    if (totalClasses > 0) {
      courseAttendancePct = Math.round(
        ((totalP + totalL) / totalClasses) * 100,
      );
    }
  }

  return (
    <div className="flex h-screen bg-[#F3F4F6] font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-700 to-slate-800 h-64 relative px-10 pt-10">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">
                Teacher Dashboard
              </h1>
              <p className="text-blue-100 text-sm opacity-80">
                Overview of your courses and attendance
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-3 text-white flex items-center gap-3">
              <FiClock size={18} />
              <span className="font-mono font-bold text-xl tracking-widest">
                {currentTime.toLocaleTimeString("en-US", { hour12: false })}
              </span>
            </div>
          </div>
        </div>

        <div className="px-10 -mt-24 relative z-10 grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <StatCard
            icon={<FiBook />}
            label="Courses Teaching"
            value={courses.length}
            sub="courses this semester"
            gradient="from-blue-600 to-blue-500"
            shadow="shadow-blue-200"
          />
          <StatCard
            icon={<FiActivity />}
            label="Sessions This Week"
            value={thisWeekSessions}
            sub={`across ${thisWeekCourses} course(s)`}
            gradient="from-emerald-500 to-teal-400"
            shadow="shadow-emerald-200"
          />
          <StatCard
            icon={<FiTrendingUp />}
            label="Course Attendance"
            value={
              courseAttendancePct !== null ? `${courseAttendancePct}%` : "—"
            }
            sub={
              selectedCourse ? selectedCourse.name : "Select a course to view"
            }
            gradient="from-amber-400 to-orange-400"
            shadow="shadow-orange-200"
          />
        </div>

        <div className="px-10 pb-10 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2">
              <FiBarChart2 className="text-blue-500" /> Overall Attendance
              Report
            </h2>
            <div className="max-w-md">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">
                Select Course
              </label>
              <div className="relative">
                <select
                  className="w-full appearance-none bg-blue-50 text-blue-900 font-bold pl-4 pr-10 py-3 rounded-xl border border-blue-100 focus:outline-none cursor-pointer text-sm"
                  value={selectedCourse?.id || ""}
                  onChange={(e) => {
                    const c = courses.find(
                      (x) => x.id === parseInt(e.target.value),
                    );
                    setSelectedCourse(c || null);
                  }}
                >
                  <option value="">— Select Course —</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.course_code}: {c.name}
                    </option>
                  ))}
                </select>
                <FiChevronDown className="absolute right-3 top-3.5 text-blue-500 pointer-events-none" />
              </div>
            </div>
          </div>

          {loadingReport ? (
            <div className="bg-white rounded-3xl p-10 text-center text-gray-400 font-medium">
              Loading overall attendance data...
            </div>
          ) : reportData ? (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
              {/* ✅ แทนที่บล็อกสีเรียบๆ ด้วย SummaryCard จากหน้า Report */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <SummaryCard
                  label="Enrolled Students"
                  value={totalStudents}
                  color="blue"
                  icon={<FiUsers size={14} />}
                />
                <SummaryCard
                  label="Total Present"
                  value={totalP}
                  color="emerald"
                  icon={<FiCheckCircle size={14} />}
                />
                <SummaryCard
                  label="Total Late"
                  value={totalL}
                  color="orange"
                  icon={<FiClock size={14} />}
                />
                <SummaryCard
                  label="Total Absent"
                  value={totalA}
                  color="rose"
                  icon={<FiXCircle size={14} />}
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                      <th className="pb-3 pl-4">#</th>
                      <th className="pb-3">Student ID</th>
                      <th className="pb-3">Name</th>
                      <th className="pb-3 text-center">Present</th>
                      <th className="pb-3 text-center">Late</th>
                      <th className="pb-3 text-center">Absent</th>
                      <th className="pb-3 text-center">Total Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.records.slice(0, 8).map((r, i) => {
                      const realStudentId = r.email
                        ? r.email.split("@")[0]
                        : String(r.student_id);
                      return (
                        <tr
                          key={r.student_id || i}
                          className="border-b border-gray-50 hover:bg-gray-50 transition h-14"
                        >
                          <td className="pl-4 text-gray-400 text-xs">
                            {i + 1}
                          </td>
                          <td className="font-bold text-gray-700">
                            {realStudentId}
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
                                {r.name?.charAt(0) || "?"}
                              </div>
                              <span className="font-semibold text-gray-800">
                                {r.name}
                              </span>
                            </div>
                          </td>
                          <td className="text-center font-bold text-emerald-600">
                            {r.present}
                          </td>
                          <td className="text-center font-bold text-orange-500">
                            {r.late}
                          </td>
                          <td className="text-center font-bold text-rose-500">
                            {r.absent}
                          </td>
                          <td className="text-center font-bold text-gray-700">
                            {r.total_score == null
                              ? "—"
                              : Number(r.total_score).toFixed(1)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {reportData.records.length > 8 && (
                <div className="text-center mt-4">
                  <button
                    onClick={() => navigate("/teacher/attendance-report")}
                    className="text-slate-600 text-sm font-bold hover:underline"
                  >
                    View all {reportData.records.length} students →
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-10 text-center text-gray-400">
              <FiBook size={40} className="mx-auto mb-3 opacity-20" />
              <p className="font-medium">
                Select a course to view overall attendance
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// 📌 Card ด้านบน Dashboard
function StatCard({ icon, label, value, sub, gradient, shadow }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-6 text-white shadow-xl ${shadow} bg-gradient-to-br ${gradient} transition-transform hover:scale-[1.02]`}
    >
      <div className="flex items-center gap-2 mb-3 opacity-90">
        <div className="p-2 bg-white/20 rounded-lg">{icon}</div>
        <span className="font-bold text-sm uppercase tracking-wide">
          {label}
        </span>
      </div>
      <h2 className="text-5xl font-extrabold tracking-tight">{value}</h2>
      <p className="text-white/70 text-xs mt-1 font-medium">{sub}</p>
    </div>
  );
}

// 📌 ดึง Component SummaryCard จากหน้า AttendanceReport มาใช้งานตรงนี้
function SummaryCard({ label, value, color, icon }) {
  const colors = {
    blue: "from-blue-600 to-blue-500 shadow-blue-200",
    emerald: "from-emerald-500 to-teal-400 shadow-emerald-200",
    orange: "from-orange-400 to-amber-400 shadow-orange-200",
    rose: "from-rose-500 to-pink-500 shadow-rose-200",
  };
  return (
    <div
      className={`rounded-2xl p-5 text-white bg-gradient-to-br ${colors[color]} shadow-lg`}
    >
      <div className="flex items-center gap-2 text-white/80 mb-2 text-xs font-bold uppercase tracking-wider">
        {icon} {label}
      </div>
      <p className="text-4xl font-black">{value}</p>
    </div>
  );
}
