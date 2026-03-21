import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../api/axios";
import Sidebar from "../../components/Sidebar";
import {
  FiBook,
  FiClock,
  FiCheckCircle,
  FiActivity,
  FiPlusSquare,
  FiXCircle,
  FiAlertCircle,
  FiCamera,
  FiArrowRight,
  FiAlertTriangle,
  FiChevronRight,
  FiUser,
  FiBarChart2,
  FiCalendar,
} from "react-icons/fi";
const pctBarColor = (pct, threshold) => {
  if (pct >= threshold) return "bg-emerald-400";
  if (pct >= threshold * 0.85) return "bg-orange-400";
  return "bg-rose-500";
};

export default function StudentDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const successMsg = location.state?.message || null;

  const studentName = localStorage.getItem("user_name") || "Student";
  const studentId = parseInt(localStorage.getItem("user_id"));

  const [currentTime, setCurrentTime] = useState(new Date());
  const [faceRegistered, setFaceRegistered] = useState(null);
  const [courses, setCourses] = useState([]);
  const [reports, setReports] = useState({});
  const [loadingReports, setLoadingReports] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    api
      .get("/student/face-status")
      .then((r) => setFaceRegistered(r.data.registered))
      .catch(() => setFaceRegistered(false));
  }, []);

  useEffect(() => {
    api
      .get("/student/my-courses")
      .then((r) => setCourses(r.data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (courses.length === 0) return;
    setLoadingReports(true);
    Promise.all(
      courses.map((c) =>
        api
          .get(`/courses/${c.id}/report`)
          .then((r) => ({ courseId: c.id, data: r.data }))
          .catch(() => ({ courseId: c.id, data: null })),
      ),
    )
      .then((results) => {
        const map = {};
        results.forEach(({ courseId, data }) => {
          map[courseId] = data;
        });
        setReports(map);
      })
      .finally(() => setLoadingReports(false));
  }, [courses]);

  const todayStr = currentTime.toLocaleDateString("en-US", { weekday: "long" });

  const enrolledCount = courses.length;

  const classesThisWeek = courses.length;

  const classesToday = courses.filter((c) => c.day_of_week === todayStr).length;

  const warningCourses = courses.filter((c) => {
    const r = reports[c.id];
    if (!r) return false;
    const me = r.students?.find((s) => s.student_id === studentId);
    return me && me.attendance_pct < (r.course?.attendance_threshold || 80);
  });
  const atRiskCount = warningCourses.length;

  const hour = currentTime.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="flex h-screen bg-[#F3F4F6] font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-700 to-slate-800 h-64 relative px-10 pt-10 pb-24">
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-slate-300 text-sm font-medium mb-1">
                {greeting}
              </p>
              <h1 className="text-4xl font-bold text-white mb-1 flex items-center gap-3">
                <FiUser className="bg-white/10 p-1.5 rounded-lg" size={36} />
                {studentName}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-3 text-white flex items-center gap-3">
                <FiClock size={18} />
                <span className="font-mono font-bold text-xl tracking-widest">
                  {currentTime.toLocaleTimeString("en-US", { hour12: false })}
                </span>
              </div>
            </div>
          </div>

          {successMsg && (
            <div className="absolute bottom-4 left-10 right-10 bg-emerald-500/90 backdrop-blur text-white px-5 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 z-10">
              <FiCheckCircle /> {successMsg}
            </div>
          )}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
        </div>

        <div className="px-10 -mt-20 pb-10 relative z-20">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 min-h-[600px] flex flex-col gap-6">
            {faceRegistered === false && (
              <div className="flex items-center justify-between gap-4 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
                    <FiCamera size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-amber-800 text-sm">
                      Face not registered yet
                    </p>
                    <p className="text-xs text-amber-600 mt-0.5">
                      Register your face to check in automatically during
                      sessions.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate("/student/register-face")}
                  className="shrink-0 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition"
                >
                  Register Now <FiArrowRight size={12} />
                </button>
              </div>
            )}
            {faceRegistered === true && (
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-3">
                <FiCheckCircle
                  className="text-emerald-500 shrink-0"
                  size={16}
                />
                <p className="text-sm font-semibold text-emerald-700">
                  Face registered — ready to check in automatically.
                </p>
                <button
                  onClick={() => navigate("/student/register-face")}
                  className="ml-auto text-xs text-slate-500 font-bold hover:underline"
                >
                  Re-register
                </button>
              </div>
            )}

            {courses.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SummaryCard
                  label="Enrolled"
                  value={enrolledCount}
                  color="blue"
                  icon={<FiBook size={14} />}
                  sub="Active courses"
                />
                <SummaryCard
                  label="This Week"
                  value={classesThisWeek}
                  color="slate"
                  icon={<FiCalendar size={14} />}
                  sub="Total sessions"
                />
                <SummaryCard
                  label="Classes Today"
                  value={classesToday}
                  color={classesToday > 0 ? "emerald" : "slate"}
                  icon={<FiClock size={14} />}
                  sub={todayStr}
                />
                <SummaryCard
                  label="At Risk"
                  value={atRiskCount}
                  color={atRiskCount > 0 ? "rose" : "emerald"}
                  icon={<FiAlertTriangle size={14} />}
                  sub={
                    atRiskCount > 0 ? "Below attendance criteria" : "All good ✓"
                  }
                />
              </div>
            )}

            {courses.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
                <FiBook size={48} className="opacity-20" />
                <p className="text-sm font-medium">
                  You haven't enrolled in any courses yet
                </p>
                <button
                  onClick={() => navigate("/student/enroll")}
                  className="mt-2 inline-flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-slate-200"
                >
                  <FiPlusSquare size={14} /> Join Your First Course
                </button>
              </div>
            )}

            {courses.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <FiBarChart2 size={14} /> My Courses
                  </p>
                  <button
                    onClick={() => navigate("/student/stu-attendance")}
                    className="text-xs text-slate-600 font-bold hover:underline flex items-center gap-1"
                  >
                    Full report <FiArrowRight size={11} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {courses.map((c) => {
                    const r = reports[c.id];
                    const me = r?.students?.find(
                      (s) => s.student_id === studentId,
                    );
                    const threshold = r?.course?.attendance_threshold ?? 80;
                    const pct = me?.attendance_pct ?? null;
                    const totalSess = r?.total_sessions ?? 0;

                    return (
                      <div
                        key={c.id}
                        onClick={() =>
                          navigate("/student/stu-attendance", {
                            state: { courseId: c.id },
                          })
                        }
                        className="rounded-2xl border border-gray-100 bg-gray-50/50 p-5 cursor-pointer hover:bg-white hover:shadow-sm transition-all group"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg">
                                {c.course_code}
                              </span>
                              <span className="text-xs text-gray-400 font-medium">
                                Sec {c.section}
                              </span>
                            </div>
                            <p className="font-bold text-gray-800 text-sm truncate pr-2">
                              {c.name}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {c.day_of_week} ·{" "}
                              {String(c.start_time).slice(0, 5)}–
                              {String(c.end_time).slice(0, 5)}
                            </p>
                          </div>
                          <FiChevronRight
                            size={15}
                            className="text-gray-300 group-hover:text-slate-500 transition shrink-0 mt-1"
                          />
                        </div>

                        {loadingReports ? (
                          <div className="h-8 bg-gray-100 rounded-lg animate-pulse" />
                        ) : me ? (
                          <>
                            <div className="flex items-center gap-3 mb-3 text-xs font-bold">
                              <span className="flex items-center gap-1 text-emerald-600">
                                <FiCheckCircle size={11} /> {me.present} present
                              </span>
                              <span className="flex items-center gap-1 text-orange-500">
                                <FiAlertCircle size={11} /> {me.late} late
                              </span>
                              <span className="flex items-center gap-1 text-rose-500">
                                <FiXCircle size={11} /> {me.absent} absent
                              </span>
                              <span className="ml-auto text-gray-400 font-medium">
                                {totalSess} sessions
                              </span>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-400 font-medium">
                                  Attendance
                                </span>
                                <span
                                  className={`font-bold ${pct >= threshold ? "text-emerald-600" : pct >= threshold * 0.85 ? "text-orange-500" : "text-rose-500"}`}
                                >
                                  {pct ?? 0}%
                                  <span className="text-gray-300 font-normal ml-1">
                                    / {threshold}% req
                                  </span>
                                </span>
                              </div>
                              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${pctBarColor(pct ?? 0, threshold)}`}
                                  style={{
                                    width: `${Math.min(pct ?? 0, 100)}%`,
                                  }}
                                />
                              </div>
                            </div>
                            {r?.course?.use_scoring &&
                              me.total_score !== null && (
                                <p className="text-xs text-gray-400 mt-2 font-medium">
                                  Score:{" "}
                                  <span className="text-slate-700 font-bold">
                                    {me.total_score}
                                  </span>
                                  {me.max_score ? (
                                    <span className="text-gray-300">
                                      {" "}
                                      / {me.max_score} pts
                                    </span>
                                  ) : null}
                                </p>
                              )}
                          </>
                        ) : (
                          <p className="text-xs text-gray-400 font-medium">
                            {totalSess === 0
                              ? "No sessions yet"
                              : "No attendance records"}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function SummaryCard({ label, value, color, icon, sub }) {
  const colors = {
    blue: "from-blue-600 to-blue-500 shadow-blue-200",
    slate: "from-slate-600 to-slate-500 shadow-slate-200",
    emerald: "from-emerald-500 to-teal-400 shadow-emerald-200",
    orange: "from-orange-400 to-amber-400 shadow-orange-200",
    rose: "from-rose-500 to-pink-500 shadow-rose-200",
  };
  return (
    <div
      className={`rounded-2xl p-5 text-white bg-gradient-to-br ${colors[color]} shadow-lg`}
    >
      <div className="flex items-center gap-2 text-white/90 mb-2 text-xs font-bold uppercase tracking-wider">
        {icon} {label}
      </div>
      <p className="text-4xl font-black">{value}</p>
      {sub && <p className="text-white/80 text-xs mt-1 font-medium">{sub}</p>}
    </div>
  );
}
