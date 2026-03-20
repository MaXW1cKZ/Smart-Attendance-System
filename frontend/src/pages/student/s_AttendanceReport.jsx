import React, { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import api from "../../api/axios";
import {
  FiSearch,
  FiDownload,
  FiFileText,
  FiChevronLeft,
  FiChevronRight,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiChevronDown,
  FiBarChart2,
  FiRefreshCw,
  FiTrendingUp,
  FiAlertCircle,
} from "react-icons/fi";

const STATUS_COLORS = {
  present: "bg-emerald-100 text-emerald-600 border-emerald-200",
  late: "bg-orange-100 text-orange-600 border-orange-200",
  absent: "bg-rose-100 text-rose-600 border-rose-200",
};
const STATUS_ICONS = {
  present: <FiCheckCircle className="mr-1" />,
  late: <FiClock className="mr-1" />,
  absent: <FiXCircle className="mr-1" />,
};

const PAGE_SIZE = 10;

export default function Stu_Attendance() {
  const location = useLocation();
  const studentId = parseInt(localStorage.getItem("user_id"));

  const [courses, setCourses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionDetail, setSessionDetail] = useState(null);
  const [courseReport, setCourseReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("week");
  const [page, setPage] = useState(1);

  useEffect(() => {
    api
      .get("/student/my-courses")
      .then((r) => {
        setCourses(r.data);
        const preselect = location.state?.courseId;
        if (preselect) {
          const c = r.data.find((x) => x.id === preselect);
          if (c) setSelectedCourse(c);
          else if (r.data.length > 0) setSelectedCourse(r.data[0]);
        } else if (r.data.length > 0) {
          setSelectedCourse(r.data[0]);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedCourse) return;
    setSessions([]);
    setSelectedSession(null);
    setSessionDetail(null);
    setCourseReport(null);
    setPage(1);

    Promise.all([
      api.get(`/courses/${selectedCourse.id}/sessions`),
      api.get(`/courses/${selectedCourse.id}/report`),
    ])
      .then(([sessRes, reportRes]) => {
        const started = sessRes.data.filter(
          (s) => s.actual_start_time || s.is_active,
        );
        setSessions(started);
        setCourseReport(reportRes.data);
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
    setLoading(true);
    setSessionDetail(null);
    setPage(1);
    api
      .get(`/sessions/${selectedSession.id}/attendance`)
      .then((r) => setSessionDetail(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedSession]);

  const myRecord = sessionDetail?.records?.find(
    (r) => r.student_id === studentId,
  );

  const myStats = courseReport?.students?.find(
    (s) => s.student_id === studentId,
  );
  const course = courseReport?.course;

  const filteredRecords = useMemo(() => {
    if (!sessionDetail) return [];
    let rows = myRecord ? [myRecord] : [];

    if (search)
      rows = rows.filter(
        (r) =>
          r.name?.toLowerCase().includes(search.toLowerCase()) ||
          String(r.student_id).includes(search),
      );
    if (filterStatus !== "all")
      rows = rows.filter((r) => r.status === filterStatus);

    return rows;
  }, [sessionDetail, myRecord, search, filterStatus]);

  const allSessionRows = useMemo(() => {
    return sessions.filter((s) => s.actual_end_time || s.is_active);
  }, [sessions]);

  const totalPages = Math.ceil(allSessionRows.length / PAGE_SIZE);
  const paginated = allSessionRows.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  const summary = sessionDetail?.summary;

  const handleExportCSV = () => {
    if (!selectedCourse || !myStats) return;
    const BOM = "\uFEFF";
    const headers = [
      `Course: ${selectedCourse.course_code} - ${selectedCourse.name}`,
      `Student: ${localStorage.getItem("user_name") || ""}`,
      `Attendance: ${myStats.attendance_pct}%  |  ${myStats.passed ? "PASSING" : "AT RISK"}`,
      "",
      "Week,Date,Topic,Room,Status,Check-in,Score",
    ].join("\n");
    const rows = [
      `,,,,Present,, ${myStats.present}`,
      `,,,,Late,, ${myStats.late}`,
      `,,,,Absent,, ${myStats.absent}`,
      course?.use_scoring
        ? `,,,,Score,, ${myStats.total_score}/${myStats.max_score}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    const blob = new Blob([BOM + headers + "\n" + rows], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `my_attendance_${selectedCourse.course_code}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen bg-[#F3F4F6] font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-700 to-indigo-600 h-64 relative px-10 pt-10 pb-24">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <FiFileText className="bg-white/20 p-1.5 rounded-lg" size={36} />
              My Attendance Report
            </h1>
            <p className="text-blue-100 opacity-90 pl-1">
              View your attendance history and scores for each session
            </p>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
        </div>

        <div className="px-10 -mt-20 pb-10 relative z-20">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 min-h-[600px] flex flex-col gap-6">
            <div className="flex flex-col xl:flex-row gap-4 border-b border-gray-100 pb-6">
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
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

              <div className="flex flex-col gap-1 flex-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
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

            {myStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SummaryCard
                  label="Present"
                  value={myStats.present}
                  color="emerald"
                  icon={<FiCheckCircle size={14} />}
                />
                <SummaryCard
                  label="Late"
                  value={myStats.late}
                  color="orange"
                  icon={<FiClock size={14} />}
                />
                <SummaryCard
                  label="Absent"
                  value={myStats.absent}
                  color="rose"
                  icon={<FiXCircle size={14} />}
                />
                <SummaryCard
                  label={course?.use_scoring ? "My Score" : "Attendance"}
                  value={
                    course?.use_scoring
                      ? `${myStats.total_score}/${myStats.max_score}`
                      : `${myStats.attendance_pct}%`
                  }
                  color={myStats.passed ? "blue" : "rose"}
                  icon={<FiTrendingUp size={14} />}
                  sub={myStats.passed ? "Passing ✓" : "At Risk ✗"}
                />
              </div>
            )}

            {sessionDetail && (
              <div className="flex flex-wrap justify-between items-center gap-3">
                <div className="flex flex-wrap gap-2">
                  <span className="bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1.5 rounded-lg">
                    Week {sessionDetail.session.week_number}
                  </span>
                  {sessionDetail.session.topic && (
                    <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-1.5 rounded-lg">
                      {sessionDetail.session.topic}
                    </span>
                  )}
                  {sessionDetail.session.room && (
                    <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-1.5 rounded-lg">
                      Room: {sessionDetail.session.room}
                    </span>
                  )}
                  {sessionDetail.session.actual_start_time && (
                    <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-1.5 rounded-lg">
                      {new Date(
                        sessionDetail.session.actual_start_time,
                      ).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      })}
                      {sessionDetail.session.actual_end_time
                        ? ` – ${new Date(sessionDetail.session.actual_end_time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}`
                        : " (ongoing)"}
                    </span>
                  )}
                </div>

                <div className="flex gap-2 items-center">
                  <div className="relative">
                    <FiSearch
                      className="absolute left-2.5 top-2.5 text-gray-400"
                      size={14}
                    />
                    <input
                      placeholder="Search..."
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                      }}
                      className="pl-8 pr-3 py-2 bg-gray-50 rounded-xl border text-sm font-medium w-40 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                  <div className="relative">
                    <select
                      value={filterStatus}
                      onChange={(e) => {
                        setFilterStatus(e.target.value);
                        setPage(1);
                      }}
                      className="appearance-none bg-gray-50 border rounded-xl text-sm font-semibold pl-3 pr-8 py-2 focus:outline-none text-gray-600 cursor-pointer"
                    >
                      <option value="all">All</option>
                      <option value="present">Present</option>
                      <option value="late">Late</option>
                      <option value="absent">Absent</option>
                    </select>
                    <FiChevronDown
                      className="absolute right-2 top-2.5 text-gray-400 pointer-events-none"
                      size={14}
                    />
                  </div>
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition shadow-sm shadow-emerald-200"
                  >
                    <FiDownload size={15} /> Export CSV
                  </button>
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <FiRefreshCw className="animate-spin mr-2" /> Loading...
              </div>
            ) : !sessionDetail ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
                <FiBarChart2 size={48} className="opacity-20" />
                <p className="text-sm font-medium">
                  Select a Course and Session to view your record
                </p>
              </div>
            ) : (
              <>
                <MySessionCard
                  record={myRecord}
                  course={sessionDetail.course}
                  session={sessionDetail.session}
                />

                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                    Class Summary — Week {sessionDetail.session.week_number}
                  </p>
                  <div className="grid grid-cols-4 gap-4">
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
                </div>

                <AllSessionsTable
                  sessions={sessions}
                  studentId={studentId}
                  course={course}
                  page={page}
                  setPage={setPage}
                  totalPages={totalPages}
                  paginated={paginated}
                />
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function MySessionCard({ record, course, session }) {
  const STATUS_MAP = {
    present: {
      bg: "bg-emerald-50 border-emerald-200",
      text: "text-emerald-700",
      badge: "bg-emerald-100 text-emerald-600 border-emerald-200",
      icon: <FiCheckCircle size={24} />,
      label: "Present",
    },
    late: {
      bg: "bg-orange-50 border-orange-200",
      text: "text-orange-700",
      badge: "bg-orange-100 text-orange-600 border-orange-200",
      icon: <FiAlertCircle size={24} />,
      label: "Late",
    },
    absent: {
      bg: "bg-rose-50 border-rose-200",
      text: "text-rose-700",
      badge: "bg-rose-100 text-rose-600 border-rose-200",
      icon: <FiXCircle size={24} />,
      label: "Absent",
    },
  };

  if (!record) {
    return (
      <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-6 text-center text-gray-400">
        <FiXCircle size={24} className="mx-auto mb-2 opacity-30" />
        <p className="font-semibold text-sm">
          No attendance record found for this session
        </p>
      </div>
    );
  }

  const s = STATUS_MAP[record.status] || STATUS_MAP.absent;

  let elapsedMin = null;
  if (session?.actual_start_time && record.timestamp) {
    elapsedMin = Math.round(
      (new Date(record.timestamp) - new Date(session.actual_start_time)) /
        60000,
    );
  }

  return (
    <div
      className={`border rounded-2xl p-5 flex items-center justify-between gap-4 ${s.bg}`}
    >
      <div className="flex items-center gap-4">
        <div className={s.text}>{s.icon}</div>
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
            My Attendance — Week {session?.week_number}
          </p>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border ${s.badge}`}
            >
              {s.label}
            </span>
            {elapsedMin !== null && (
              <span className="text-xs text-gray-500 font-medium">
                checked in{" "}
                {elapsedMin > 0 ? `+${elapsedMin} min after start` : "on time"}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="text-right shrink-0">
        {record.timestamp && (
          <p className="font-mono font-bold text-gray-700 text-xl">
            {new Date(record.timestamp).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })}
          </p>
        )}
        {course?.use_scoring && record.score !== null && (
          <p className="text-xs text-gray-400 mt-0.5">
            Score:{" "}
            <span className="text-blue-600 font-bold">{record.score} pt</span>
          </p>
        )}
        <p className="text-xs text-gray-400 mt-0.5">
          Late ≥ +{course?.late_after_minutes ?? 15}m · Absent ≥ +
          {course?.absent_after_minutes ?? 60}m
        </p>
      </div>
    </div>
  );
}

function AllSessionsTable({
  sessions,
  studentId,
  course,
  page,
  setPage,
  totalPages,
  paginated,
}) {
  const [rowData, setRowData] = useState({});
  const [fetchedIds, setFetchedIds] = useState(new Set());

  useEffect(() => {
    paginated.forEach(async (s) => {
      if (!s.actual_end_time) return;
      if (fetchedIds.has(s.id)) return;
      setFetchedIds((prev) => new Set([...prev, s.id]));
      try {
        const res = await api.get(`/sessions/${s.id}/attendance`);
        const myRec = res.data.records?.find((r) => r.student_id === studentId);
        setRowData((prev) => ({
          ...prev,
          [s.id]: {
            status: myRec?.status || "absent",
            score: myRec?.score ?? null,
            timestamp: myRec?.timestamp || null,
          },
        }));
      } catch {
        setRowData((prev) => ({
          ...prev,
          [s.id]: { status: "absent", score: null, timestamp: null },
        }));
      }
    });
  }, [paginated]);

  if (sessions.length === 0) return null;

  return (
    <div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
        Full History — All Sessions
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-sm">
          <thead>
            <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
              <th className="pb-3 pl-4 w-16">Week</th>
              <th className="pb-3">Date</th>
              <th className="pb-3">Topic / Room</th>
              <th className="pb-3 text-center">Check-in</th>
              {course?.use_scoring && (
                <th className="pb-3 text-center">Score</th>
              )}
              <th className="pb-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((s) => {
              const row = rowData[s.id];
              const status = row?.status || (s.is_active ? null : "absent");
              return (
                <tr
                  key={s.id}
                  className="border-b border-gray-50 hover:bg-gray-50/80 transition h-16"
                >
                  <td className="pl-4 font-bold text-gray-400 text-xs">
                    W{s.week_number}
                  </td>
                  <td className="font-bold text-gray-700">
                    {s.date
                      ? new Date(s.date + "T12:00").toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          },
                        )
                      : "—"}
                  </td>
                  <td className="text-gray-500 text-xs">
                    {s.topic && (
                      <p className="font-semibold text-gray-600">{s.topic}</p>
                    )}
                    {s.room && <p>Room {s.room}</p>}
                    {!s.topic && !s.room && (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="text-center font-mono text-gray-600 text-xs">
                    {row?.timestamp ? (
                      new Date(row.timestamp).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      })
                    ) : s.is_active ? (
                      <span className="text-blue-400 font-semibold">Live</span>
                    ) : (
                      "—"
                    )}
                  </td>
                  {course?.use_scoring && (
                    <td className="text-center font-bold text-gray-700">
                      {row?.score !== null && row?.score !== undefined
                        ? row.score
                        : "—"}
                    </td>
                  )}
                  <td className="text-center">
                    {s.is_active && !row ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border bg-blue-50 text-blue-500 border-blue-200">
                        🔴 Live
                      </span>
                    ) : !row ? (
                      <span className="inline-block w-12 h-4 bg-gray-100 rounded animate-pulse" />
                    ) : (
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${STATUS_COLORS[status] || "bg-gray-100 text-gray-500 border-gray-200"}`}
                      >
                        {STATUS_ICONS[status]}
                        {status === "present"
                          ? "Present"
                          : status === "late"
                            ? "Late"
                            : "Absent"}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between items-center pt-4 border-t border-gray-100 mt-4">
          <span className="text-sm text-gray-400">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="w-9 h-9 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40"
            >
              <FiChevronLeft />
            </button>
            {Array.from(
              { length: Math.min(totalPages, 7) },
              (_, i) => i + 1,
            ).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-bold transition-all ${
                  p === page
                    ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                    : "border border-gray-200 text-gray-500 hover:bg-gray-50"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="w-9 h-9 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40"
            >
              <FiChevronRight />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, color, icon, sub }) {
  const colors = {
    blue: "from-blue-500 to-blue-400 shadow-blue-200",
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
      {sub && <p className="text-white/70 text-xs mt-1 font-medium">{sub}</p>}
    </div>
  );
}
