import React, { useState, useEffect, useMemo } from "react";
import Sidebar from "../../components/Sidebar";
import api from "../../api/axios";
import {
  FiSearch,
  FiDownload,
  FiFileText,
  FiChevronLeft,
  FiChevronRight,
  FiEdit,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiChevronDown,
  FiBarChart2,
  FiRefreshCw,
  FiUsers,
  FiAlertCircle,
} from "react-icons/fi";

const STATUS_COLORS = {
  present: "bg-emerald-100 text-emerald-600 border-emerald-200",
  late: "bg-orange-100 text-orange-600 border-orange-200",
  absent: "bg-rose-100 text-rose-600 border-rose-200",
};

const PAGE_SIZE = 10;

// ยก Component StatusBadge จาก TeacherDashboard มาใช้เป๊ะๆ
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

export default function AttendanceReport() {
  const [courses, setCourses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState(null);
  const [reportFetchError, setReportFetchError] = useState(null);
  const [reportFetchNonce, setReportFetchNonce] = useState(0);

  useEffect(() => {
    api
      .get("/courses/my-courses")
      .then((r) => setCourses(r.data))
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
    if (!selectedSession || !selectedCourse) return;
    setLoading(true);
    setPage(1);
    setReportData(null);
    setEditingId(null);
    setReportFetchError(null);

    const isOverall = selectedSession === "overall";
    const endpoint = isOverall
      ? `/courses/${selectedCourse.id}/overall-report`
      : `/sessions/${selectedSession.id}/attendance`;

    api
      .get(endpoint)
      .then((r) => {
        setReportData(r.data);
        setReportFetchError(null);
      })
      .catch((err) => {
        console.error("Fetch Report Error:", err);
        const detail = err.response?.data?.detail;
        const detailStr =
          typeof detail === "string"
            ? detail
            : Array.isArray(detail)
              ? detail.map((d) => d.msg || d).join(", ")
              : null;
        if (!err.response && err.message === "Network Error") {
          setReportFetchError(
            "Cannot reach the API server. Start the backend (e.g. uvicorn on port 8000), refresh the page, or check that the dev proxy in vite.config.js matches your setup.",
          );
        } else {
          setReportFetchError(
            detailStr || err.message || "Failed to load report",
          );
        }
      })
      .finally(() => setLoading(false));
  }, [selectedSession, selectedCourse, reportFetchNonce]);

  const isOverallView = selectedSession === "overall";

  const filtered = useMemo(() => {
    if (!reportData?.records) return [];
    let rows = [...reportData.records];

    if (search) {
      rows = rows.filter((r) => {
        const realStudentId = r.email
          ? r.email.split("@")[0]
          : String(r.student_id);
        return (
          r.name.toLowerCase().includes(search.toLowerCase()) ||
          realStudentId.includes(search)
        );
      });
    }

    if (!isOverallView && filterStatus !== "all") {
      rows = rows.filter((r) => r.status === filterStatus);
    }

    rows.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "status" && !isOverallView)
        return a.status.localeCompare(b.status);
      if (sortBy === "score") {
        const scoreA = isOverallView ? a.total_score : a.score;
        const scoreB = isOverallView ? b.total_score : b.score;
        const numA = Number(scoreA ?? 0);
        const numB = Number(scoreB ?? 0);
        return numB - numA;
      }
      return 0;
    });
    return rows;
  }, [reportData, search, filterStatus, sortBy, isOverallView]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleStatusChange = async (attId, newStatus) => {
    try {
      await api.patch(`/attendance/${attId}`, { status: newStatus });
      const r = await api.get(`/sessions/${selectedSession.id}/attendance`);
      setReportData(r.data);
      setEditingId(null);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update status");
    }
  };

  const handleExportCSV = () => {
    if (!reportData || !selectedCourse || !selectedSession) return;

    let headers = [];
    let rows = [];

    if (isOverallView) {
      headers = [
        "#",
        "Student ID",
        "Name",
        "Email",
        "Present",
        "Late",
        "Absent",
        "Total Score",
      ];
      rows = filtered.map((r, i) => {
        const sid = r.email ? r.email.split("@")[0] : r.student_id;
        return [
          i + 1,
          sid,
          r.name,
          r.email || "-",
          r.present,
          r.late,
          r.absent,
          r.total_score,
        ];
      });
    } else {
      headers = [
        "#",
        "Student ID",
        "Name",
        "Email",
        "Check-in Time",
        "Status",
        "Score",
      ];
      rows = filtered.map((r, i) => {
        const sid = r.email ? r.email.split("@")[0] : r.student_id;
        const time = r.timestamp
          ? new Date(r.timestamp).toLocaleTimeString("en-US", { hour12: false })
          : "-";
        return [i + 1, sid, r.name, r.email || "-", time, r.status, r.score];
      });
    }

    const titleInfo = isOverallView
      ? `Course: ${selectedCourse.name} (${selectedCourse.course_code}) - Overall Summary`
      : `Course: ${selectedCourse.name} (${selectedCourse.course_code}) - Week ${selectedSession.week_number}`;

    const csvContent = [
      titleInfo,
      `Exported: ${new Date().toLocaleString("en-US")}`,
      "",
      headers.join(","),
      ...rows.map((r) => r.map((v) => `"${v}"`).join(",")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = isOverallView
      ? `overall_${selectedCourse.course_code}.csv`
      : `attendance_${selectedCourse.course_code}_week${selectedSession.week_number}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const summary = reportData?.summary;

  return (
    <div className="flex h-screen bg-[#F3F4F6] font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-700 to-slate-900 h-64 relative px-10 pt-10 pb-24">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <FiFileText className="bg-white/20 p-1.5 rounded-lg" size={36} />
              Attendance Report
            </h1>
            <p className="text-blue-100 opacity-90 pl-1">
              View and manage attendance records for each session or full term
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

              <div className="flex flex-col gap-1 flex-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Session
                </label>
                <div className="relative">
                  <select
                    className="w-full appearance-none bg-gray-50 text-gray-700 font-bold pl-4 pr-10 py-3 rounded-xl border border-gray-200 focus:outline-none cursor-pointer text-sm disabled:opacity-50"
                    value={
                      isOverallView ? "overall" : selectedSession?.id || ""
                    }
                    disabled={!selectedCourse || sessions.length === 0}
                    onChange={(e) => {
                      if (e.target.value === "overall") {
                        setSelectedSession("overall");
                      } else {
                        const s = sessions.find(
                          (x) => x.id === parseInt(e.target.value),
                        );
                        setSelectedSession(s || null);
                      }
                    }}
                  >
                    <option value="">— Select Session —</option>
                    {sessions.length > 0 && (
                      <option value="overall">
                        Overall Summary (All Sessions)
                      </option>
                    )}
                    {sessions.map((s) => (
                      <option key={s.id} value={s.id}>
                        Week {s.week_number}
                        {s.date
                          ? ` · ${new Date(s.date + "T12:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                          : ""}
                        {s.is_active ? " 🔴 Live" : ""}
                        {s.topic ? ` · ${s.topic}` : ""}
                      </option>
                    ))}
                  </select>
                  <FiChevronDown className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {reportFetchError && !loading && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                <div className="flex gap-2 items-start">
                  <FiAlertCircle
                    className="shrink-0 mt-0.5 text-rose-500"
                    size={18}
                  />
                  <span className="font-medium leading-relaxed">
                    {reportFetchError}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setReportFetchNonce((n) => n + 1)}
                  className="shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-bold text-rose-700 border border-rose-200 hover:bg-rose-100 transition"
                >
                  <FiRefreshCw size={14} /> Retry
                </button>
              </div>
            )}

            {summary && !isOverallView && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SummaryCard
                  label="Total Students"
                  value={summary.total}
                  color="blue"
                  icon={<FiUsers size={14} />}
                />
                <SummaryCard
                  label="Present"
                  value={summary.present}
                  color="emerald"
                  icon={<FiCheckCircle size={14} />}
                />
                <SummaryCard
                  label="Late"
                  value={summary.late}
                  color="orange"
                  icon={<FiClock size={14} />}
                />
                <SummaryCard
                  label="Absent"
                  value={summary.absent}
                  color="rose"
                  icon={<FiXCircle size={14} />}
                />
              </div>
            )}

            {reportData && (
              <div className="flex flex-wrap gap-3 items-center justify-between">
                <div className="flex gap-3 flex-wrap">
                  <div className="relative">
                    <FiSearch
                      className="absolute left-3 top-2.5 text-gray-400"
                      size={15}
                    />
                    <input
                      type="text"
                      placeholder="Search name or ID..."
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                      }}
                      className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-200 w-52"
                    />
                  </div>

                  {!isOverallView && (
                    <div className="relative">
                      <select
                        className="appearance-none pl-3 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none cursor-pointer"
                        value={filterStatus}
                        onChange={(e) => {
                          setFilterStatus(e.target.value);
                          setPage(1);
                        }}
                      >
                        <option value="all">All Statuses</option>
                        <option value="present">Present</option>
                        <option value="late">Late</option>
                        <option value="absent">Absent</option>
                      </select>
                      <FiChevronDown
                        className="absolute right-2 top-2.5 text-gray-400 pointer-events-none"
                        size={14}
                      />
                    </div>
                  )}

                  <div className="relative">
                    <select
                      className="appearance-none pl-3 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none cursor-pointer"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <option value="name">Sort: Name</option>
                      {!isOverallView && (
                        <option value="status">Sort: Status</option>
                      )}
                      <option value="score">Sort: Score</option>
                    </select>
                    <FiChevronDown
                      className="absolute right-2 top-2.5 text-gray-400 pointer-events-none"
                      size={14}
                    />
                  </div>
                </div>
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition shadow-sm shadow-emerald-200"
                >
                  <FiDownload size={15} /> Export CSV
                </button>
              </div>
            )}

            {loading ? (
              <div className="flex-1 flex items-center justify-center text-gray-400 py-20">
                <FiRefreshCw className="animate-spin mr-2" /> Loading...
              </div>
            ) : !reportData ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3 py-20">
                {!reportFetchError && (
                  <>
                    <FiBarChart2 size={48} className="opacity-20" />
                    <p className="text-sm font-medium">
                      Select a Course and Session to view report
                    </p>
                  </>
                )}
              </div>
            ) : (
              <>
                {/* 📌 ใช้ CSS ตารางเป๊ะๆ จาก TeacherDashboard เลยครับ 📌 */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                        <th className="pb-3 pl-4">#</th>
                        <th className="pb-3 pl-4">Student ID</th>
                        <th className="pb-3">Name</th>

                        {isOverallView ? (
                          <>
                            <th className="pb-3 text-center">Present</th>
                            <th className="pb-3 text-center">Late</th>
                            <th className="pb-3 text-center">Absent</th>
                            <th className="pb-3 text-center">Total Score</th>
                          </>
                        ) : (
                          <>
                            <th className="pb-3 text-center">Check-in Time</th>
                            <th className="pb-3 text-center">Score</th>
                            <th className="pb-3 text-center">Status</th>
                            <th className="pb-3 text-center">Edit</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.map((r, i) => {
                        const realStudentId = r.email
                          ? r.email.split("@")[0]
                          : `ID:${r.student_id}`;

                        return (
                          <tr
                            key={r.attendance_id || r.student_id}
                            className="border-b border-gray-50 hover:bg-gray-50 transition h-14"
                          >
                            <td className="pl-4 text-gray-400 text-xs font-medium">
                              {(page - 1) * PAGE_SIZE + i + 1}
                            </td>
                            <td className="pl-4 font-bold text-black text-sm">
                              {realStudentId}
                            </td>
                            <td>
                              <div className="flex items-center gap-3">
                                <div className="flex flex-col">
                                  <span className="font-bold text-gray-800">
                                    {r.name}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {isOverallView ? (
                              <>
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
                              </>
                            ) : (
                              <>
                                <td className="text-center text-xs text-gray-500 font-medium">
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
                                  {editingId === r.attendance_id ? (
                                    <div className="flex gap-1 justify-center">
                                      {["present", "late", "absent"].map(
                                        (s) => (
                                          <button
                                            key={s}
                                            onClick={() =>
                                              handleStatusChange(
                                                r.attendance_id,
                                                s,
                                              )
                                            }
                                            className={`px-2 py-1 rounded-lg text-xs font-bold border transition-all capitalize ${STATUS_COLORS[s]}`}
                                          >
                                            {s}
                                          </button>
                                        ),
                                      )}
                                      <button
                                        onClick={() => setEditingId(null)}
                                        className="px-2 py-1 rounded-lg text-[10px] font-bold border border-gray-200 text-gray-400 hover:bg-gray-50"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <StatusBadge status={r.status} />
                                  )}
                                </td>
                                <td className="text-center">
                                  <button
                                    onClick={() =>
                                      setEditingId(
                                        editingId === r.attendance_id
                                          ? null
                                          : r.attendance_id,
                                      )
                                    }
                                    className="text-gray-400 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                                  >
                                    <FiEdit size={15} />
                                  </button>
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })}
                      {filtered.length === 0 && (
                        <tr>
                          <td
                            colSpan="8"
                            className="py-12 text-center text-gray-400 font-medium bg-gray-50/50"
                          >
                            No records match your search criteria
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-100 mt-2">
                  <span className="text-sm text-gray-400">
                    Showing{" "}
                    {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–
                    {Math.min(page * PAGE_SIZE, filtered.length)} of{" "}
                    {filtered.length} students
                  </span>
                  <div className="flex gap-2">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}
                      className="w-9 h-9 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40"
                    >
                      <FiChevronLeft />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (p) => (
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
                      ),
                    )}
                    <button
                      disabled={page === totalPages || totalPages === 0}
                      onClick={() => setPage((p) => p + 1)}
                      className="w-9 h-9 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40"
                    >
                      <FiChevronRight />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

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
