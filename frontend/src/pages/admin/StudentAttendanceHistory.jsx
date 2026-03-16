import React, { useState, useEffect, useCallback } from "react";
import api from "../../api/axios";
import Sidebar from "../../components/Sidebar";
import {
  FiFileText,
  FiSearch,
  FiDownload,
  FiChevronLeft,
  FiChevronRight,
  FiCalendar,
  FiCheckCircle,
  FiAlertCircle,
  FiXCircle,
  FiUser,
  FiRefreshCw,
} from "react-icons/fi";

const PAGE_SIZE = 10;

const STATUS_STYLE = {
  present: "text-emerald-600 bg-emerald-50 border-emerald-200",
  late: "text-orange-600 bg-orange-50 border-orange-200",
  absent: "text-rose-600 bg-rose-50 border-rose-200",
};
const STATUS_ICON = {
  present: <FiCheckCircle size={13} />,
  late: <FiAlertCircle size={13} />,
  absent: <FiXCircle size={13} />,
};

export default function StudentAttendanceHistory() {
  // Search student
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Pick course
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);

  // Attendance records (all sessions of that course for that student)
  const [sessions, setSessions] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState("all");

  // Search students (uses admin/users endpoint with search)
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await api.get(
        `/admin/users?role=student&search=${encodeURIComponent(searchQuery.trim())}&limit=10`,
      );
      setSearchResults(res.data.users || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectStudent = async (student) => {
    setSelectedStudent(student);
    setSearchResults([]);
    setSearchQuery(student.full_name || student.email);
    setSelectedCourse(null);
    setSessions([]);
    // Load enrolled courses
    try {
      const res = await api.get(`/admin/users/${student.id}/courses`);
      setCourses(res.data || []);
    } catch {
      // Fallback: get via enrollments from course list
      setCourses([]);
    }
  };

  // Load sessions + my attendance when course selected
  useEffect(() => {
    if (!selectedCourse || !selectedStudent) return;
    setLoadingRecords(true);
    setSessions([]);
    setPage(1);

    api
      .get(`/courses/${selectedCourse.id}/sessions`)
      .then(async (r) => {
        const ended = r.data.filter((s) => s.actual_end_time || s.is_active);
        const rows = await Promise.all(
          ended.map(async (s) => {
            try {
              const att = await api.get(`/sessions/${s.id}/attendance`);
              const rec = att.data.records?.find(
                (r) => r.student_id === selectedStudent.id,
              );
              return {
                id: s.id,
                week_number: s.week_number,
                date: s.date,
                topic: s.topic,
                room: s.room,
                is_active: s.is_active,
                status: rec?.status || "absent",
                score: rec?.score ?? null,
                timestamp: rec?.timestamp || null,
                course: att.data.course,
              };
            } catch {
              return { ...s, status: "absent", score: null, timestamp: null };
            }
          }),
        );
        setSessions(rows.reverse());
      })
      .catch(console.error)
      .finally(() => setLoadingRecords(false));
  }, [selectedCourse, selectedStudent]);

  const filtered =
    filterStatus === "all"
      ? sessions
      : sessions.filter((s) => s.status === filterStatus);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const present = sessions.filter((s) => s.status === "present").length;
  const late = sessions.filter((s) => s.status === "late").length;
  const absent = sessions.filter((s) => s.status === "absent").length;
  const attPct =
    sessions.length > 0
      ? Math.round(((present + late) / sessions.length) * 100)
      : 0;

  const handleExport = () => {
    if (!sessions.length || !selectedStudent || !selectedCourse) return;
    const BOM = "\uFEFF";
    const header = [
      `Student: ${selectedStudent.full_name} (${selectedStudent.email})`,
      `Course: ${selectedCourse.course_code} - ${selectedCourse.name}`,
      `Attendance: ${attPct}%`,
      "",
      "Week,Date,Topic,Room,Check-in,Status,Score",
    ].join("\n");
    const rows = sessions
      .map((s) =>
        [
          s.week_number,
          s.date
            ? new Date(s.date + "T12:00").toLocaleDateString("en-US")
            : "—",
          s.topic || "—",
          s.room || "—",
          s.timestamp
            ? new Date(s.timestamp).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })
            : "—",
          s.status,
          s.score ?? "—",
        ].join(","),
      )
      .join("\n");
    const blob = new Blob([BOM + header + "\n" + rows], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `history_${selectedStudent.email}_${selectedCourse.course_code}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen bg-[#F3F4F6] font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 h-64 relative px-10 pt-10 pb-24">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <FiFileText className="bg-white/10 p-1.5 rounded-lg" size={36} />
              Student Attendance History
            </h1>
            <p className="text-slate-300 opacity-90">
              Search a student → pick a course → view full attendance
            </p>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
        </div>

        <div className="px-10 -mt-20 pb-10 relative z-20">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 min-h-[600px] flex flex-col gap-6">
            {/* Step 1 + 2: Search + Course selector */}
            <div className="flex flex-col md:flex-row gap-4 border-b border-gray-100 pb-6">
              {/* Student search */}
              <div className="flex-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">
                  <FiUser className="inline mr-1" size={11} /> Search Student
                </label>
                <div className="flex gap-2 relative">
                  <input
                    placeholder="Name or email…"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSearchResults([]);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="flex-1 px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-slate-400 outline-none text-sm font-medium"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={searching}
                    className="px-5 py-3 bg-slate-700 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {searching ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <FiSearch size={15} />
                    )}
                    Search
                  </button>

                  {/* Dropdown results */}
                  {searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-16 mt-1 bg-white rounded-2xl shadow-xl border border-gray-100 z-30 overflow-hidden">
                      {searchResults.map((s) => (
                        <div
                          key={s.id}
                          onClick={() => handleSelectStudent(s)}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 cursor-pointer transition border-b border-gray-50 last:border-0"
                        >
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-sm font-bold shrink-0">
                            {(s.full_name || s.email).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-gray-800 text-sm">
                              {s.full_name || "—"}
                            </p>
                            <p className="text-xs text-gray-400">{s.email}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {searchResults.length === 0 &&
                    searchQuery &&
                    !searching &&
                    selectedStudent?.email !== searchQuery && (
                      <div className="absolute top-full left-0 right-16 mt-1 bg-white rounded-2xl shadow-xl border border-gray-100 z-30 px-4 py-3 text-sm text-gray-400">
                        No students found
                      </div>
                    )}
                </div>
              </div>

              {/* Course selector */}
              <div className="flex-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">
                  Course
                </label>
                <select
                  disabled={!selectedStudent || courses.length === 0}
                  value={selectedCourse?.id || ""}
                  onChange={(e) => {
                    const c = courses.find(
                      (x) => x.id === parseInt(e.target.value),
                    );
                    setSelectedCourse(c || null);
                  }}
                  className="w-full appearance-none bg-gray-50 text-gray-700 font-bold px-4 py-3 rounded-xl border-2 border-transparent focus:border-slate-400 outline-none cursor-pointer disabled:opacity-40 text-sm"
                >
                  <option value="">
                    {!selectedStudent
                      ? "— Select student first —"
                      : courses.length === 0
                        ? "— No enrolled courses —"
                        : "— Select Course —"}
                  </option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.course_code}: {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Summary row */}
            {selectedStudent &&
              selectedCourse &&
              !loadingRecords &&
              sessions.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5 text-sm">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="font-bold text-gray-700">
                        Present: {present}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm">
                      <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                      <span className="font-bold text-gray-700">
                        Late: {late}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      <span className="font-bold text-gray-700">
                        Absent: {absent}
                      </span>
                    </div>
                    <span
                      className={`text-sm font-black px-3 py-1 rounded-lg ${attPct >= 80 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-600"}`}
                    >
                      {attPct}% {attPct >= 80 ? "✓ Passing" : "✗ At Risk"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {/* Filter */}
                    <select
                      value={filterStatus}
                      onChange={(e) => {
                        setFilterStatus(e.target.value);
                        setPage(1);
                      }}
                      className="text-xs font-bold bg-gray-50 px-3 py-2 rounded-xl border text-gray-600 focus:outline-none cursor-pointer"
                    >
                      <option value="all">All</option>
                      <option value="present">Present</option>
                      <option value="late">Late</option>
                      <option value="absent">Absent</option>
                    </select>
                    <button
                      onClick={handleExport}
                      className="flex items-center gap-1.5 px-4 py-2 bg-slate-700 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
                    >
                      <FiDownload size={13} /> Export CSV
                    </button>
                  </div>
                </div>
              )}

            {/* Table */}
            {loadingRecords ? (
              <div className="flex-1 flex items-center justify-center text-gray-400 font-medium">
                Loading…
              </div>
            ) : !selectedStudent ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-300 gap-2">
                <FiSearch size={40} className="opacity-30" />
                <p className="text-sm font-medium">
                  Search for a student to get started
                </p>
              </div>
            ) : !selectedCourse ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-300 gap-2">
                <FiFileText size={40} className="opacity-30" />
                <p className="text-sm font-medium">
                  Select a course to view attendance
                </p>
              </div>
            ) : paginated.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                No records found
              </div>
            ) : (
              <>
                <div className="overflow-x-auto flex-1">
                  <table className="w-full min-w-[700px] text-sm">
                    <thead>
                      <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                        <th className="pb-3 pl-4 w-12">Week</th>
                        <th className="pb-3">Date</th>
                        <th className="pb-3">Topic / Room</th>
                        <th className="pb-3 text-center">Check-in</th>
                        <th className="pb-3 text-center">Score</th>
                        <th className="pb-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.map((s) => (
                        <tr
                          key={s.id}
                          className="border-b border-gray-50 hover:bg-gray-50 transition h-14"
                        >
                          <td className="pl-4 text-gray-400 font-bold text-xs">
                            W{s.week_number}
                          </td>
                          <td className="font-bold text-gray-700">
                            <div className="flex items-center gap-1.5">
                              <FiCalendar size={11} className="text-gray-400" />
                              {s.date
                                ? new Date(
                                    s.date + "T12:00",
                                  ).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })
                                : "—"}
                            </div>
                          </td>
                          <td className="text-xs text-gray-500">
                            {s.topic && (
                              <p className="font-semibold text-gray-600">
                                {s.topic}
                              </p>
                            )}
                            {s.room && <p>Room {s.room}</p>}
                            {!s.topic && !s.room && (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className="text-center font-mono text-xs text-gray-500">
                            {s.timestamp
                              ? new Date(s.timestamp).toLocaleTimeString(
                                  "en-US",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: false,
                                  },
                                )
                              : "—"}
                          </td>
                          <td className="text-center font-bold text-gray-700 text-sm">
                            {s.score !== null && s.score !== undefined
                              ? s.score
                              : "—"}
                          </td>
                          <td className="text-center">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${STATUS_STYLE[s.status] || "bg-gray-100 text-gray-500 border-gray-200"}`}
                            >
                              {STATUS_ICON[s.status]}
                              {s.status?.charAt(0).toUpperCase() +
                                s.status?.slice(1)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                    <span className="text-sm text-gray-400">
                      Page {page} of {totalPages} · {filtered.length} sessions
                    </span>
                    <div className="flex gap-2">
                      <button
                        disabled={page === 1}
                        onClick={() => setPage((p) => p - 1)}
                        className="w-9 h-9 flex items-center justify-center border rounded-lg hover:bg-gray-50 disabled:opacity-40"
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
                          className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-bold transition ${p === page ? "bg-slate-700 text-white" : "border text-gray-500 hover:bg-gray-50"}`}
                        >
                          {p}
                        </button>
                      ))}
                      <button
                        disabled={page === totalPages}
                        onClick={() => setPage((p) => p + 1)}
                        className="w-9 h-9 flex items-center justify-center border rounded-lg hover:bg-gray-50 disabled:opacity-40"
                      >
                        <FiChevronRight />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
