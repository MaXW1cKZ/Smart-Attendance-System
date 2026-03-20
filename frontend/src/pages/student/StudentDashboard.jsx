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
  FiTrendingUp,
  FiPlusSquare,
  FiXCircle,
  FiAlertCircle,
} from "react-icons/fi";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const successMsg = location.state?.message || null;

  const studentId = parseInt(localStorage.getItem("user_id"));

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

  useEffect(() => {
    api
      .get("/student/my-courses")
      .then((r) => {
        setCourses(r.data);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedCourse) return;
    setSessions([]);
    setSelectedSession(null);
    setReportData(null);
    api
      .get(`/courses/${selectedCourse.id}/sessions`)
      .then((r) => {
        const started = r.data.filter(
          (s) => s.actual_start_time || s.is_active,
        );
        setSessions(started);
        if (started.length > 0) {
          const latest = started.reduce((a, b) =>
            a.week_number > b.week_number ? a : b,
          );
          setSelectedSession(latest);
        }
      })
      .catch(console.error);
  }, [selectedCourse]);

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

  const myRecord = reportData?.records?.find((r) => r.student_id === studentId);

  const totalAttended = sessions.filter((s) => s.actual_end_time).length;

  const sessionStatus = myRecord?.status ?? null;

  return (
    <div className="flex h-screen bg-[#F3F4F6] font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-700 to-indigo-600 h-64 relative px-10 pt-10">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">
                Student Dashboard
              </h1>
              <p className="text-blue-100 text-sm opacity-80">
                Overview of your courses and attendance
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/student/enroll")}
                className="bg-white/15 hover:bg-white/25 border border-white/30 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition"
              >
                <FiPlusSquare size={16} /> Join Course
              </button>
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-3 text-white flex items-center gap-3">
                <FiClock size={18} />
                <span className="font-mono font-bold text-xl tracking-widest">
                  {currentTime.toLocaleTimeString("en-US", { hour12: false })}
                </span>
              </div>
            </div>
          </div>

          {successMsg && (
            <div className="absolute bottom-4 left-10 right-10 bg-emerald-500/90 backdrop-blur text-white px-5 py-3 rounded-xl text-sm font-semibold flex items-center gap-2">
              <FiCheckCircle /> {successMsg}
            </div>
          )}
        </div>

        <div className="px-10 -mt-24 relative z-10 grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <StatCard
            icon={<FiBook />}
            label="Enrolled Courses"
            value={courses.length}
            sub="courses this semester"
            gradient="from-blue-500 to-indigo-500"
            shadow="shadow-blue-200"
          />
          <StatCard
            icon={<FiActivity />}
            label="Sessions Completed"
            value={selectedCourse ? totalAttended : "—"}
            sub={
              selectedCourse ? selectedCourse.name : "Select a course to view"
            }
            gradient="from-emerald-500 to-teal-400"
            shadow="shadow-emerald-200"
          />
          <StatCard
            icon={<FiTrendingUp />}
            label="My Status"
            value={
              sessionStatus
                ? sessionStatus.charAt(0).toUpperCase() + sessionStatus.slice(1)
                : "—"
            }
            sub={
              selectedSession
                ? `Week ${selectedSession.week_number}`
                : "Select a session to view"
            }
            gradient={
              sessionStatus === "present"
                ? "from-emerald-400 to-teal-400"
                : sessionStatus === "late"
                  ? "from-amber-400 to-orange-400"
                  : sessionStatus === "absent"
                    ? "from-rose-500 to-pink-500"
                    : "from-amber-400 to-orange-400"
            }
            shadow={
              sessionStatus === "absent"
                ? "shadow-rose-200"
                : "shadow-orange-200"
            }
          />
        </div>

        <div className="px-10 pb-10 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2">
              <FiBarChart2 className="text-blue-500" /> View My Attendance
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
                          ? ` · ${new Date(s.date + "T12:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
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

          {loadingReport ? (
            <div className="bg-white rounded-3xl p-10 text-center text-gray-400 font-medium">
              Loading attendance data...
            </div>
          ) : reportData ? (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
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

              <MyAttendanceCard
                record={myRecord}
                course={reportData.course}
                lateAfter={reportData.course?.late_after_minutes ?? 15}
                absentAfter={reportData.course?.absent_after_minutes ?? 60}
                sessionStartTime={reportData.session?.actual_start_time}
              />

              <div className="mt-6">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Class Summary
                </p>
                <div className="grid grid-cols-4 gap-4">
                  {[
                    {
                      label: "Total",
                      value: reportData.summary.total,
                      color: "text-gray-800",
                      bg: "bg-gray-50",
                    },
                    {
                      label: "Present",
                      value: reportData.summary.present,
                      color: "text-emerald-600",
                      bg: "bg-emerald-50",
                    },
                    {
                      label: "Late",
                      value: reportData.summary.late,
                      color: "text-orange-600",
                      bg: "bg-orange-50",
                    },
                    {
                      label: "Absent",
                      value: reportData.summary.absent,
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
              </div>

              <div className="text-center mt-4">
                <button
                  onClick={() =>
                    navigate("/student/attendance-report", {
                      state: { courseId: selectedCourse?.id },
                    })
                  }
                  className="text-blue-600 text-sm font-bold hover:underline"
                >
                  View full attendance history →
                </button>
              </div>
            </div>
          ) : selectedCourse && sessions.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center text-gray-400">
              <FiActivity size={40} className="mx-auto mb-3 opacity-20" />
              <p className="font-medium">
                No sessions started for this course yet
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-10 text-center text-gray-400">
              <FiBook size={40} className="mx-auto mb-3 opacity-20" />
              <p className="font-medium">
                {courses.length === 0
                  ? "You haven't enrolled in any courses yet"
                  : "Select a course to view your attendance"}
              </p>
              {courses.length === 0 && (
                <button
                  onClick={() => navigate("/student/enroll")}
                  className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg"
                >
                  <FiPlusSquare size={14} /> Join Your First Course
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function MyAttendanceCard({
  record,
  course,
  lateAfter,
  absentAfter,
  sessionStartTime,
}) {
  const STATUS_STYLES = {
    present: {
      bg: "bg-emerald-50 border-emerald-200",
      text: "text-emerald-700",
      badge: "bg-emerald-100 text-emerald-600 border-emerald-200",
      icon: <FiCheckCircle size={28} />,
      label: "Present",
    },
    late: {
      bg: "bg-orange-50 border-orange-200",
      text: "text-orange-700",
      badge: "bg-orange-100 text-orange-600 border-orange-200",
      icon: <FiAlertCircle size={28} />,
      label: "Late",
    },
    absent: {
      bg: "bg-rose-50 border-rose-200",
      text: "text-rose-700",
      badge: "bg-rose-100 text-rose-600 border-rose-200",
      icon: <FiXCircle size={28} />,
      label: "Absent",
    },
  };

  if (!record) {
    return (
      <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-6 text-center text-gray-400">
        <FiActivity size={28} className="mx-auto mb-2 opacity-30" />
        <p className="font-semibold text-sm">
          No attendance record for you in this session
        </p>
      </div>
    );
  }

  const style = STATUS_STYLES[record.status] || STATUS_STYLES.absent;

  let elapsedMin = null;
  if (sessionStartTime && record.timestamp) {
    elapsedMin = Math.round(
      (new Date(record.timestamp) - new Date(sessionStartTime)) / 60000,
    );
  }

  return (
    <div
      className={`border rounded-2xl p-5 flex items-center justify-between gap-4 ${style.bg}`}
    >
      <div className="flex items-center gap-4">
        <div className={`${style.text}`}>{style.icon}</div>
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">
            My Attendance
          </p>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border ${style.badge}`}
            >
              {style.label}
            </span>
            {elapsedMin !== null && (
              <span className="text-xs text-gray-500 font-medium">
                checked in {elapsedMin > 0 ? `+${elapsedMin} min` : "on time"}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="text-right shrink-0">
        {record.timestamp && (
          <p className="font-mono font-bold text-gray-700 text-lg">
            {new Date(record.timestamp).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })}
          </p>
        )}
        {course?.use_scoring &&
          record.score !== null &&
          record.score !== undefined && (
            <p className="text-xs text-gray-400 font-bold">
              Score: <span className="text-blue-600">{record.score} pt</span>
            </p>
          )}
        <p className="text-xs text-gray-400 mt-0.5">
          Late ≥ +{lateAfter}m · Absent ≥ +{absentAfter}m
        </p>
      </div>
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
