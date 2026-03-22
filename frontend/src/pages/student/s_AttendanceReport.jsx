import React, { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import api from "../../api/axios";
import {
  FiFileText,
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiChevronDown,
  FiDownload,
  FiFilter,
  FiSearch,
  FiCalendar,
  FiPlay,
  FiBarChart2,
  FiX,
} from "react-icons/fi";

const PAGE_SIZE = 10;

const STATUS_META = {
  present: {
    label: "Present",
    color: "bg-emerald-100 text-emerald-600",
    icon: <FiCheckCircle size={12} />,
  },
  late: {
    label: "Late",
    color: "bg-orange-100 text-orange-600",
    icon: <FiClock size={12} />,
  },
  absent: {
    label: "Absent",
    color: "bg-rose-100 text-rose-600",
    icon: <FiXCircle size={12} />,
  },
  live: {
    label: "Live",
    color: "bg-blue-100 text-blue-600",
    icon: <FiPlay size={12} />,
  },
  upcoming: {
    label: "Upcoming",
    color: "bg-gray-100 text-gray-500",
    icon: <FiCalendar size={12} />,
  },
};

export default function Stu_Attendance() {
  const location = useLocation();
  const studentId = parseInt(localStorage.getItem("user_id"));

  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const [sessions, setSessions] = useState([]);
  const [courseReport, setCourseReport] = useState(null);
  const [attendanceData, setAttendanceData] = useState({});
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
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
  }, [location.state]);

  const fetchCourseData = () => {
    if (!selectedCourse) return;
    setLoading(true);
    setSessions([]);
    setCourseReport(null);
    setAttendanceData({});
    setPage(1);

    Promise.all([
      api.get(`/courses/${selectedCourse.id}/sessions`),
      api.get(`/courses/${selectedCourse.id}/report`),
    ])
      .then(async ([sessRes, reportRes]) => {
        const allSessions = sessRes.data || [];
        setSessions(allSessions);
        setCourseReport(reportRes.data);

        try {
          const attendancePromises = allSessions.map((s) =>
            s.actual_start_time || s.is_active
              ? api.get(`/sessions/${s.id}/attendance`).catch(() => null)
              : Promise.resolve(null),
          );

          const results = await Promise.all(attendancePromises);
          const newAttendanceData = {};

          allSessions.forEach((s, index) => {
            const res = results[index];
            if (res?.data?.records) {
              const myRec = res.data.records.find(
                (r) => r.student_id === studentId,
              );
              newAttendanceData[s.id] = myRec || {
                status: "absent",
                score: null,
                timestamp: null,
              };
            } else {
              newAttendanceData[s.id] = null;
            }
          });

          setAttendanceData(newAttendanceData);
        } catch (e) {
          console.error("Error fetching records", e);
        } finally {
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCourseData();
  }, [selectedCourse, studentId]);

  useEffect(() => {
    setPage(1);
  }, [filterStatus, search]);

  const myStats = courseReport?.students?.find(
    (s) => s.student_id === studentId,
  );
  const course = courseReport?.course;

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const record = attendanceData[s.id];
      const matchSearch =
        !search ||
        (s.topic && s.topic.toLowerCase().includes(search.toLowerCase())) ||
        (s.room && s.room.toLowerCase().includes(search.toLowerCase()));

      let status = record?.status;
      if (!s.actual_start_time && !s.is_active) status = "upcoming";
      else if (s.is_active && !record) status = "live";
      else status = status || "absent";

      const matchStatus = filterStatus === "all" || status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [sessions, attendanceData, search, filterStatus]);

  const total = filteredSessions.length;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const paginated = filteredSessions.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  const fmtTime = (ts) =>
    ts
      ? new Date(ts).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      : "—";

  const fmtDate = (dateStr) =>
    dateStr
      ? new Date(dateStr + "T12:00").toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "—";

  const handleExportCSV = () => {
    if (!selectedCourse || !myStats) return;
    const BOM = "\uFEFF";

    const headerInfo = [
      `Course:,${selectedCourse.course_code} - "${selectedCourse.name.replace(/"/g, '""')}"`,
      `Student:,"${localStorage.getItem("user_name") || ""}"`,
      `Overall Attendance:,${myStats.attendance_pct}% (${myStats.passed ? "PASSING" : "AT RISK"})`,
      `Total Present:,${myStats.present}`,
      `Total Late:,${myStats.late}`,
      `Total Absent:,${myStats.absent}`,
      course?.use_scoring
        ? `Total Score:,${myStats.total_score}/${myStats.max_score}`
        : "",
      "",
    ]
      .filter((line) => line !== "")
      .join("\n");

    const tableHeaders = "Week,Date,Topic,Room,Session Time,My Check-in,Status";

    const tableRows = sessions
      .map((s) => {
        const record = attendanceData[s.id];

        let status = record?.status;
        if (!s.actual_start_time && !s.is_active) status = "upcoming";
        else if (s.is_active && !record) status = "live";
        else status = status || "absent";

        const meta = STATUS_META[status] || STATUS_META.upcoming;

        const dateStr = s.date
          ? new Date(s.date + "T12:00").toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "—";
        const topicStr = s.topic ? `"${s.topic.replace(/"/g, '""')}"` : "—";
        const roomStr = s.room ? `"${s.room.replace(/"/g, '""')}"` : "—";

        let sessionTimeStr = "—";
        if (s.actual_start_time) {
          const start = fmtTime(s.actual_start_time);
          const end = s.actual_end_time ? fmtTime(s.actual_end_time) : "Now";
          sessionTimeStr = `${start} - ${end}`;
        }

        const checkInStr = record?.timestamp ? fmtTime(record.timestamp) : "—";

        return `${s.week_number},"${dateStr}",${topicStr},${roomStr},"${sessionTimeStr}","${checkInStr}",${meta.label}`;
      })
      .join("\n");

    const csvContent = [headerInfo, tableHeaders, tableRows].join("\n");

    const blob = new Blob([BOM + csvContent], {
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
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-slate-900 h-64 relative px-10 pt-10 pb-24">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <FiFileText className="bg-white/10 p-1.5 rounded-lg" size={36} />
              My Attendance
            </h1>
            <p className="text-blue-100 opacity-90">
              View your attendance records and overall performance
            </p>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
        </div>

        <div className="px-10 -mt-20 pb-10 relative z-20">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 min-h-[600px] flex flex-col">
            <div className="flex justify-between items-end mb-6 flex-wrap gap-4 border-b border-gray-100 pb-6">
              <div className="flex flex-col gap-1.5 flex-1 max-w-sm">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Select Course
                </label>
                <div className="relative">
                  <select
                    className="w-full appearance-none bg-gray-50 text-gray-700 font-bold pl-4 pr-10 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
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
                  <FiChevronDown className="absolute right-4 top-3.5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {selectedCourse && (
                <button
                  onClick={fetchCourseData}
                  className="p-3 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-500 transition border border-gray-200"
                  title="Refresh Data"
                >
                  <FiRefreshCw
                    size={15}
                    className={loading ? "animate-spin" : ""}
                  />
                </button>
              )}
            </div>

            {!selectedCourse ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 font-medium py-12">
                <FiFileText size={48} className="opacity-20 mb-4" />
                Select a course to view attendance
              </div>
            ) : loading ? (
              <div className="flex-1 flex items-center justify-center text-gray-400 font-medium py-12">
                Loading data...
              </div>
            ) : (
              <>
                {myStats && (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <SummaryCard
                      label="Attendance"
                      value={`${myStats.attendance_pct || 0}%`}
                      sub={myStats.passed ? "Passing Criteria" : "At Risk"}
                      color={myStats.passed ? "blue" : "rose"}
                      icon={<FiBarChart2 size={16} />}
                    />
                    <SummaryCard
                      label="Present"
                      value={myStats.present || 0}
                      sub="On-time check-ins"
                      color="emerald"
                      icon={<FiCheckCircle size={16} />}
                    />
                    <SummaryCard
                      label="Late"
                      value={myStats.late || 0}
                      sub="Partial penalty"
                      color="orange"
                      icon={<FiClock size={16} />}
                    />
                    <SummaryCard
                      label="Absent"
                      value={myStats.absent || 0}
                      sub="Missed classes"
                      color="rose"
                      icon={<FiXCircle size={16} />}
                    />
                  </div>
                )}

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4 bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-3 flex-1 flex-wrap">
                    <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2.5 flex-1 min-w-[200px] border border-gray-200 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                      <FiSearch size={15} className="text-gray-400 shrink-0" />
                      <input
                        placeholder="Search topic or room..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="flex-1 bg-transparent text-sm outline-none text-gray-700 placeholder-gray-400 font-medium"
                      />
                      {search && (
                        <button
                          onClick={() => setSearch("")}
                          className="text-gray-400 hover:text-blue-600 transition"
                        >
                          <FiX size={14} />
                        </button>
                      )}
                    </div>

                    <div className="relative min-w-[160px]">
                      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <FiFilter size={14} className="text-gray-400" />
                      </div>
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full appearance-none bg-white text-gray-700 font-bold pl-9 pr-10 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer text-sm"
                      >
                        <option value="all">All Status</option>
                        {Object.keys(STATUS_META).map((key) => (
                          <option key={key} value={key}>
                            {STATUS_META[key].label}
                          </option>
                        ))}
                      </select>
                      <FiChevronDown className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm text-gray-400 font-medium bg-white px-3 py-2.5 rounded-xl border border-gray-100 shadow-sm">
                      {total} sessions
                    </span>
                    <button
                      onClick={handleExportCSV}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-greem-900 shadow-sm hover:shadow-md transition"
                    >
                      <FiDownload size={14} /> Export CSV
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                        <th className="pb-4 pl-4 w-16">Wk</th>
                        <th className="pb-4 w-32">Date</th>
                        <th className="pb-4">Topic / Room</th>
                        <th className="pb-4 text-center w-40">Session Time</th>
                        <th className="pb-4 text-center w-32">My Check-in</th>
                        <th className="pb-4 text-right pr-4 w-32">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.map((s) => {
                        const record = attendanceData[s.id];

                        let status = record?.status;
                        if (!s.actual_start_time && !s.is_active)
                          status = "upcoming";
                        else if (s.is_active && !record) status = "live";
                        else status = status || "absent";

                        const meta =
                          STATUS_META[status] || STATUS_META.upcoming;

                        return (
                          <tr
                            key={s.id}
                            className="border-b border-gray-50 hover:bg-gray-50 transition h-14"
                          >
                            <td className="pl-4 text-gray-400 text-xs font-bold">
                              W{s.week_number}
                            </td>
                            <td className="text-gray-600 font-semibold text-xs">
                              {fmtDate(s.date)}
                            </td>
                            <td className="text-gray-500 text-xs max-w-[200px]">
                              <p className="truncate font-semibold text-gray-700">
                                {s.topic || "—"}
                              </p>
                              {s.room && (
                                <p className="text-[10px] uppercase">
                                  {s.room}
                                </p>
                              )}
                            </td>
                            <td className="text-center font-mono text-xs text-gray-500">
                              {s.actual_start_time ? (
                                <span>
                                  {fmtTime(s.actual_start_time)} -{" "}
                                  {s.actual_end_time
                                    ? fmtTime(s.actual_end_time)
                                    : "Now"}
                                </span>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className="text-center font-mono text-xs font-bold text-slate-700">
                              {record?.timestamp
                                ? fmtTime(record.timestamp)
                                : "—"}
                            </td>
                            <td className="text-right pr-4">
                              <span
                                className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg ${meta.color}`}
                              >
                                {meta.icon} {meta.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {paginated.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="text-center py-12 text-gray-400 text-sm"
                          >
                            {total === 0
                              ? "No sessions found"
                              : "No sessions match the selected filter"}
                          </td>
                        </tr>
                      )}
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
                              ? "bg-blue-600 text-white"
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

function SummaryCard({ label, value, color, icon, sub }) {
  const colors = {
    blue: "from-blue-500 to-blue-500 shadow-blue-200",
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
