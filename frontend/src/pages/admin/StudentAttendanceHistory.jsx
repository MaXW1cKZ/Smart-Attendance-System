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
  FiEdit,
  FiX,
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
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const [sessions, setSessions] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortOrder, setSortOrder] = useState("asc");

  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (!searchQuery.trim() || selectedStudent) {
      setSearchResults([]);
      return;
    }
    const delayDebounce = setTimeout(() => {
      setSearching(true);
      api
        .get(
          `/admin/users?role=student&search=${encodeURIComponent(
            searchQuery.trim(),
          )}&limit=10`,
        )
        .then((res) => {
          const foundUsers = Array.isArray(res.data)
            ? res.data
            : res.data.users || [];
          setSearchResults(foundUsers);
        })
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false));
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, selectedStudent]);

  const handleSearchClick = () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    api
      .get(
        `/admin/users?role=student&search=${encodeURIComponent(searchQuery.trim())}&limit=10`,
      )
      .then((res) => {
        const foundUsers = Array.isArray(res.data)
          ? res.data
          : res.data.users || [];
        setSearchResults(foundUsers);
      })
      .finally(() => setSearching(false));
  };

  const handleSelectStudent = async (student) => {
    setSelectedStudent(student);
    setSearchResults([]);
    setSearchQuery(student.full_name || student.email);
    setSelectedCourse(null);
    setSessions([]);
    try {
      const res = await api.get(`/admin/users/${student.id}/courses`);
      setCourses(res.data || []);
    } catch {
      setCourses([]);
    }
  };

  const handleStatusChange = async (session, newStatus) => {
    try {
      let updatedAttendanceId = session.attendance_id;

      if (session.attendance_id) {
        await api.put(`/admin/attendance/${session.attendance_id}`, {
          status: newStatus,
        });
      } else {
        const res = await api.post(`/admin/attendance`, {
          session_id: session.id,
          student_id: selectedStudent.id,
          status: newStatus,
        });
        updatedAttendanceId = res.data.attendance_id;
      }

      setSessions((prevSessions) =>
        prevSessions.map((s) =>
          s.id === session.id
            ? { ...s, status: newStatus, attendance_id: updatedAttendanceId }
            : s,
        ),
      );
    } catch (error) {
      console.error("Failed to update status", error);
      alert("Failed to update attendance status.");
    }
  };

  useEffect(() => {
    if (!selectedCourse || !selectedStudent) return;
    setLoadingRecords(true);
    setSessions([]);
    setPage(1);

    api
      .get(`/courses/${selectedCourse.id}/sessions`)
      .then(async (r) => {
        const ended = r.data; // แสดง session ทั้งหมด (ทั้งที่จบแล้วและ active)
        const rows = await Promise.all(
          ended.map(async (s) => {
            try {
              const att = await api.get(`/admin/sessions/${s.id}/attendance`);
              const rec = att.data.records?.find(
                (r) => String(r.student_id) === String(selectedStudent.id),
              );
              return {
                id: s.id,
                attendance_id: rec?.id || null,
                week_number: s.week_number,
                date: s.date,
                topic: s.topic,
                room: s.room,
                is_active: s.is_active,
                start_time: s.start_time || null,
                end_time: s.end_time || null,
                actual_start_time: s.actual_start_time || null,
                actual_end_time: s.actual_end_time || null,
                status: rec?.status || "absent",
                score: rec?.score ?? null,
                timestamp: rec?.timestamp || null,
                course: att.data.course,
              };
            } catch {
              return {
                ...s,
                attendance_id: null,
                status: "absent",
                score: null,
                timestamp: null,
              };
            }
          }),
        );
        setSessions(rows);
      })
      .catch(console.error)
      .finally(() => setLoadingRecords(false));
  }, [selectedCourse, selectedStudent]);

  const sortedSessions = [...sessions].sort((a, b) => {
    return sortOrder === "asc"
      ? a.week_number - b.week_number
      : b.week_number - a.week_number;
  });

  const filtered =
    filterStatus === "all"
      ? sortedSessions
      : sortedSessions.filter((s) => s.status === filterStatus);

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
            <div className="flex flex-col md:flex-row gap-4 border-b border-gray-100 pb-6">
              <div className="flex-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">
                  <FiUser className="inline mr-1" size={11} /> Search Student
                </label>
                <div className="flex gap-2 relative">
                  <input
                    placeholder="Search student by name or ID..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (selectedStudent) setSelectedStudent(null);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleSearchClick()}
                    className="flex-1 px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-slate-400 outline-none text-sm font-medium"
                  />
                  <button
                    onClick={handleSearchClick}
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
                    !selectedStudent && (
                      <div className="absolute top-full left-0 right-16 mt-1 bg-white rounded-2xl shadow-xl border border-gray-100 z-30 px-4 py-3 text-sm text-gray-400">
                        No students found
                      </div>
                    )}
                </div>
              </div>

              <div className="flex-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">
                  Course
                </label>
                <select
                  disabled={!selectedStudent || courses.length === 0}
                  value={selectedCourse?.id || ""}
                  onChange={(e) => {
                    const c = courses.find(
                      (x) => String(x.id) === String(e.target.value),
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
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setSortOrder((prev) =>
                          prev === "asc" ? "desc" : "asc",
                        )
                      }
                      className="flex items-center gap-1.5 px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50 transition"
                    >
                      <FiRefreshCw
                        size={13}
                        className={sortOrder === "desc" ? "rotate-180" : ""}
                      />
                      {sortOrder === "asc" ? "Oldest First" : "Newest First"}
                    </button>
                    <button
                      onClick={handleExport}
                      className="flex items-center gap-1.5 px-4 py-2 bg-slate-700 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
                    >
                      <FiDownload size={13} /> Export CSV
                    </button>
                  </div>
                </div>
              )}

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
                        <th className="pb-3 text-center">Class Time</th>
                        <th className="pb-3 text-center">Check-in</th>
                        <th className="pb-3 text-center">Score</th>
                        <th className="pb-3 text-center">Status</th>
                        <th className="pb-3 text-center">Edit</th>
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
                          <td className="text-center font-mono text-xs text-gray-500 whitespace-nowrap">
                            {s.actual_start_time ? (
                              <span>
                                {new Date(
                                  s.actual_start_time,
                                ).toLocaleTimeString("en-US", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: false,
                                })}
                                <span className="text-gray-300 mx-1">–</span>
                                {s.actual_end_time
                                  ? new Date(
                                      s.actual_end_time,
                                    ).toLocaleTimeString("en-US", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      hour12: false,
                                    })
                                  : "ongoing"}
                              </span>
                            ) : (
                              "—"
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
                            {editingId === s.id ? (
                              <div className="flex gap-1 justify-center">
                                {["present", "late", "absent"].map((st) => (
                                  <button
                                    key={st}
                                    onClick={() => {
                                      handleStatusChange(s, st);
                                      setEditingId(null); // อัปเดตเสร็จแล้วปิดโหมดแก้ไข
                                    }}
                                    className={`px-2 py-1 rounded-lg text-xs font-bold border transition-all capitalize ${
                                      st === "present"
                                        ? "bg-emerald-100 text-emerald-600 border-emerald-200"
                                        : st === "late"
                                          ? "bg-orange-100 text-orange-600 border-orange-200"
                                          : "bg-rose-100 text-rose-600 border-rose-200"
                                    }`}
                                  >
                                    {st === "present"
                                      ? "Present"
                                      : st === "late"
                                        ? "Late"
                                        : "Absent"}
                                  </button>
                                ))}
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="px-2 py-1 rounded-lg text-xs font-bold border border-gray-200 text-gray-400 hover:bg-gray-50 transition"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                                  STATUS_STYLE[s.status || "absent"] ||
                                  "bg-gray-100 text-gray-500 border-gray-200"
                                }`}
                              >
                                {STATUS_ICON[s.status || "absent"]}
                                {(s.status || "absent")
                                  .charAt(0)
                                  .toUpperCase() +
                                  (s.status || "absent").slice(1)}
                              </span>
                            )}
                          </td>

                          {/* คอลัมน์ปุ่ม Edit (อยู่ตรงกลาง) */}
                          <td className="text-center w-16">
                            <div className="flex items-center justify-center">
                              {editingId !== s.id && (
                                <button
                                  onClick={() => setEditingId(s.id)}
                                  className="w-8 h-8 flex items-center justify-center rounded-xl border border-transparent text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
                                  title="Edit Status"
                                >
                                  <FiEdit size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

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
                          className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-bold transition ${
                            p === page
                              ? "bg-slate-700 text-white"
                              : "border text-gray-500 hover:bg-gray-50"
                          }`}
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
