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
} from "react-icons/fi";

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const successMsg = location.state?.message || null;

  const [courses, setCourses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Load courses on mount
  useEffect(() => {
    api
      .get("/courses/my-courses")
      .then((r) => setCourses(r.data))
      .catch(console.error);
  }, []);

  // Load sessions when course selected
  useEffect(() => {
    if (!selectedCourse) return;
    setSessions([]);
    setSelectedSession(null);
    setReportData(null);
    api
      .get(`/courses/${selectedCourse.id}/sessions`)
      .then((r) => {
        setSessions(r.data);
        // Auto-select the latest session
        if (r.data.length > 0) {
          const latest = r.data.reduce((a, b) =>
            a.week_number > b.week_number ? a : b,
          );
          setSelectedSession(latest);
        }
      })
      .catch(console.error);
  }, [selectedCourse]);

  // Load attendance report when session selected
  // Fetch for any session that has been started (actual_start_time set OR is_active)
  useEffect(() => {
    if (!selectedSession) return;
    if (!selectedSession.actual_start_time && !selectedSession.is_active) {
      setReportData(null);
      return;
    }
    setLoadingReport(true);
    setReportData(null);
    api
      .get(`/sessions/${selectedSession.id}/attendance`)
      .then((r) => setReportData(r.data))
      .catch(console.error)
      .finally(() => setLoadingReport(false));
  }, [selectedSession]);

  const summary = reportData?.summary;
  const attendancePct = summary
    ? Math.round(
        ((summary.present + summary.late) / (summary.total || 1)) * 100,
      )
    : null;

  return (
    <div className="flex h-screen bg-[#F3F4F6] font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
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
          {successMsg && (
            <div className="absolute bottom-4 left-10 right-10 bg-emerald-500/90 backdrop-blur text-white px-5 py-3 rounded-xl text-sm font-semibold flex items-center gap-2">
              <FiCheckCircle /> {successMsg}
            </div>
          )}
        </div>

        {/* Stats Cards */}
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
            label="Sessions Taught"
            value={sessions.filter((s) => s.actual_end_time).length || "—"}
            sub={
              selectedCourse ? selectedCourse.name : "Select a course to view"
            }
            gradient="from-emerald-500 to-teal-400"
            shadow="shadow-emerald-200"
          />
          <StatCard
            icon={<FiTrendingUp />}
            label="Attendance Rate"
            value={attendancePct !== null ? `${attendancePct}%` : "—"}
            sub={
              selectedSession
                ? `Week ${selectedSession.week_number}`
                : "Select a session to view"
            }
            gradient="from-amber-400 to-orange-400"
            shadow="shadow-orange-200"
          />
        </div>

        <div className="px-10 pb-10 space-y-6">
          {/* Course + Session Selector */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2">
              <FiBarChart2 className="text-blue-500" /> View Attendance Report
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">
                  Course
                </label>
                <div className="relative">
                  <select
                    className="w-full appearance-none bg-blue-50 text-blue-900 font-bold pl-4 pr-10 py-3 rounded-xl border border-blue-100 focus:outline-none cursor-pointer"
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
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">
                  Session
                </label>
                <div className="relative">
                  <select
                    className="w-full appearance-none bg-gray-50 text-gray-700 font-bold pl-4 pr-10 py-3 rounded-xl border border-gray-200 focus:outline-none cursor-pointer disabled:opacity-50"
                    value={selectedSession?.id || ""}
                    disabled={!selectedCourse || sessions.length === 0}
                    onChange={(e) => {
                      const s = sessions.find(
                        (x) => x.id === parseInt(e.target.value),
                      );
                      setSelectedSession(s || null);
                    }}
                  >
                    <option value="">— Select Session —</option>
                    {sessions.map((s) => (
                      <option key={s.id} value={s.id}>
                        Week {s.week_number}
                        {s.date
                          ? ` · ${new Date(
                              s.date + "T12:00",
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}`
                          : ""}
                        {s.is_active ? " 🔴 Live" : s.actual_end_time ? "" : ""}
                        {s.topic ? ` · ${s.topic}` : ""}
                      </option>
                    ))}
                  </select>
                  <FiChevronDown className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Content area */}
          {loadingReport ? (
            <div className="bg-white rounded-3xl p-10 text-center text-gray-400 font-medium">
              Loading attendance data...
            </div>
          ) : reportData ? (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
              {/* Session meta info */}
              {reportData.session && (
                <div className="mb-5 flex flex-wrap gap-2">
                  <span className="bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1 rounded-lg">
                    Week {reportData.session.week_number}
                  </span>
                  {reportData.session.topic && (
                    <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-1 rounded-lg">
                      {reportData.session.topic}
                    </span>
                  )}
                  {reportData.session.room && (
                    <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-1 rounded-lg">
                      Room: {reportData.session.room}
                    </span>
                  )}
                  {reportData.session.actual_start_time && (
                    <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-1 rounded-lg">
                      {new Date(
                        reportData.session.actual_start_time,
                      ).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      })}
                      {reportData.session.actual_end_time
                        ? ` – ${new Date(
                            reportData.session.actual_end_time,
                          ).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                          })}`
                        : " (ongoing)"}
                    </span>
                  )}
                </div>
              )}

              {/* Summary counts */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                  {
                    label: "Total",
                    value: summary.total,
                    color: "text-gray-800",
                    bg: "bg-gray-50",
                  },
                  {
                    label: "Present",
                    value: summary.present,
                    color: "text-emerald-600",
                    bg: "bg-emerald-50",
                  },
                  {
                    label: "Late",
                    value: summary.late,
                    color: "text-orange-600",
                    bg: "bg-orange-50",
                  },
                  {
                    label: "Absent",
                    value: summary.absent,
                    color: "text-rose-600",
                    bg: "bg-rose-50",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    className={`${s.bg} rounded-2xl p-4 text-center`}
                  >
                    <p className={`text-3xl font-black ${s.color}`}>
                      {s.value}
                    </p>
                    <p className="text-xs font-bold text-gray-400 mt-1">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Preview table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                      <th className="pb-3 pl-4">#</th>
                      <th className="pb-3">Name</th>
                      <th className="pb-3 text-center">Check-in Time</th>
                      <th className="pb-3 text-center">Score</th>
                      <th className="pb-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.records.slice(0, 8).map((r, i) => (
                      <tr
                        key={r.attendance_id}
                        className="border-b border-gray-50 hover:bg-gray-50 transition h-14"
                      >
                        <td className="pl-4 text-gray-400 text-xs">{i + 1}</td>
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
                        <td className="text-center text-xs text-gray-500">
                          {r.timestamp
                            ? new Date(r.timestamp).toLocaleTimeString(
                                "en-US",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: false,
                                },
                              )
                            : "—"}
                        </td>
                        <td className="text-center font-bold text-gray-700">
                          {r.score}
                        </td>
                        <td className="text-center">
                          <StatusBadge status={r.status} />
                        </td>
                      </tr>
                    ))}
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
          ) : selectedSession &&
            !selectedSession.actual_start_time &&
            !selectedSession.is_active ? (
            <div className="bg-white rounded-3xl p-10 text-center text-gray-400">
              <FiActivity size={40} className="mx-auto mb-3 opacity-20" />
              <p className="font-medium">This session has not started yet</p>
              <p className="text-sm mt-1 text-gray-300">
                No attendance data available
              </p>
            </div>
          ) : selectedCourse && sessions.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center text-gray-400">
              <FiActivity size={40} className="mx-auto mb-3 opacity-20" />
              <p className="font-medium">No sessions for this course yet</p>
              <button
                onClick={() => navigate("/teacher/device-setup")}
                className="mt-4 flex items-center gap-2 mx-auto px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg"
              >
                <FiPlay size={14} /> Start Teaching Now
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-10 text-center text-gray-400">
              <FiBook size={40} className="mx-auto mb-3 opacity-20" />
              <p className="font-medium">
                Select a course to view attendance overview
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

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

function StatusBadge({ status }) {
  const map = {
    present: "bg-emerald-100 text-emerald-600 border-emerald-200",
    late: "bg-orange-100 text-orange-600 border-orange-200",
    absent: "bg-rose-100 text-rose-600 border-rose-200",
  };
  const labels = { present: "Present", late: "Late", absent: "Absent" };
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${map[status] || "bg-gray-100 text-gray-500 border-gray-200"}`}
    >
      {labels[status] || status}
    </span>
  );
}
