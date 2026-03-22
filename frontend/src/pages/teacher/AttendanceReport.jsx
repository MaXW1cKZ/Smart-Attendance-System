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
    if (!selectedSession) return;
    setLoading(true);
    setPage(1);
    setReportData(null);
    api
      .get(`/sessions/${selectedSession.id}/attendance`)
      .then((r) => setReportData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedSession]);

  const filtered = useMemo(() => {
    if (!reportData) return [];
    let rows = [...reportData.records];
    if (search)
      rows = rows.filter(
        (r) =>
          r.name.toLowerCase().includes(search.toLowerCase()) ||
          String(r.student_id).includes(search),
      );
    if (filterStatus !== "all")
      rows = rows.filter((r) => r.status === filterStatus);
    rows.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "status") return a.status.localeCompare(b.status);
      if (sortBy === "score") return b.score - a.score;
      return 0;
    });
    return rows;
  }, [reportData, search, filterStatus, sortBy]);

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
    const headers = [
      "#",
      "Name",
      "Student ID",
      "Email",
      "Check-in Time",
      "Status",
      "Score",
    ];
    const rows = filtered.map((r, i) => [
      i + 1,
      r.name,
      r.student_id,
      r.email,
      r.timestamp
        ? new Date(r.timestamp).toLocaleTimeString("en-US", { hour12: false })
        : "-",
      r.status,
      r.score,
    ]);

    const csvContent = [
      `Course: ${selectedCourse.name} (${selectedCourse.course_code})`,
      `Session: Week ${selectedSession.week_number} — ${selectedSession.date || ""}`,
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
    a.download = `attendance_${selectedCourse.course_code}_week${selectedSession.week_number}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const summary = reportData?.summary;

  return (
    <div className="flex h-screen bg-[#F3F4F6] font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-700 to-slate-800 h-64 relative px-10 pt-10 pb-24">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <FiFileText className="bg-white/20 p-1.5 rounded-lg" size={36} />
              Attendance Report
            </h1>
            <p className="text-blue-100 opacity-90 pl-1">
              View and manage attendance records for each session
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
                        {s.is_active ? " 🔴 Live" : ""}
                        {s.topic ? ` · ${s.topic}` : ""}
                      </option>
                    ))}
                  </select>
                  <FiChevronDown className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {summary && (
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
                  <div className="relative">
                    <select
                      className="appearance-none pl-3 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none cursor-pointer"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <option value="name">Sort: Name</option>
                      <option value="status">Sort: Status</option>
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
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <FiRefreshCw className="animate-spin mr-2" /> Loading...
              </div>
            ) : !reportData ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
                <FiBarChart2 size={48} className="opacity-20" />
                <p className="text-sm font-medium">
                  Select a Course and Session to view report
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto flex-1">
                  <table className="w-full min-w-[900px] text-sm">
                    <thead>
                      <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                        <th className="pb-3 pl-4 w-12">#</th>
                        <th className="pb-3">Student Name</th>
                        <th className="pb-3">Student ID</th>
                        <th className="pb-3 text-center">Check-in Time</th>
                        <th className="pb-3">Email</th>
                        <th className="pb-3 text-center">Score</th>
                        <th className="pb-3 text-center">Status</th>
                        <th className="pb-3 text-center">Edit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.map((item, i) => (
                        <tr
                          key={item.attendance_id}
                          className="border-b border-gray-50 hover:bg-gray-50/80 transition h-16"
                        >
                          <td className="pl-4 text-gray-400 font-medium">
                            {(page - 1) * PAGE_SIZE + i + 1}
                          </td>
                          <td>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
                                {item.name?.charAt(0) || "?"}
                              </div>
                              <span className="font-bold text-gray-800">
                                {item.name}
                              </span>
                            </div>
                          </td>
                          <td className="text-gray-500 font-mono text-xs">
                            {item.student_id}
                          </td>
                          <td className="text-center font-medium text-gray-600 text-xs">
                            {item.timestamp ? (
                              new Date(item.timestamp).toLocaleTimeString(
                                "en-US",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: false,
                                },
                              )
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className="text-gray-500 text-xs">
                            {item.email}
                          </td>
                          <td className="text-center font-bold text-gray-700">
                            {item.score}
                          </td>
                          <td className="text-center">
                            {editingId === item.attendance_id ? (
                              <div className="flex gap-1 justify-center">
                                {["present", "late", "absent"].map((s) => (
                                  <button
                                    key={s}
                                    onClick={() =>
                                      handleStatusChange(item.attendance_id, s)
                                    }
                                    className={`px-2 py-1 rounded-lg text-xs font-bold border transition-all capitalize ${STATUS_COLORS[s]}`}
                                  >
                                    {s === "present"
                                      ? "Present"
                                      : s === "late"
                                        ? "Late"
                                        : "Absent"}
                                  </button>
                                ))}
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="px-2 py-1 rounded-lg text-xs font-bold border border-gray-200 text-gray-400 hover:bg-gray-50"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${STATUS_COLORS[item.status] || "bg-gray-100 text-gray-500 border-gray-200"}`}
                              >
                                {STATUS_ICONS[item.status]}
                                {item.status === "present"
                                  ? "Present"
                                  : item.status === "late"
                                    ? "Late"
                                    : "Absent"}
                              </span>
                            )}
                          </td>
                          <td className="text-center">
                            <button
                              onClick={() =>
                                setEditingId(
                                  editingId === item.attendance_id
                                    ? null
                                    : item.attendance_id,
                                )
                              }
                              className="text-gray-400 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                            >
                              <FiEdit size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filtered.length === 0 && (
                    <div className="text-center py-12 text-gray-400 text-sm font-medium">
                      No records match your search criteria
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
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
