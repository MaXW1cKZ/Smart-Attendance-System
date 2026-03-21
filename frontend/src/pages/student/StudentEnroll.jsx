import React, { useState, useEffect, useCallback } from "react";
import api from "../../api/axios";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import {
  FiPlusCircle,
  FiSearch,
  FiCheckCircle,
  FiAlertCircle,
  FiX,
  FiUser,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiRefreshCw,
  FiBook,
  FiChevronDown,
  FiFilter,
} from "react-icons/fi";

const PAGE_SIZE = 12;
const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const SEMESTERS = ["1", "2", "Summer"];

export default function StudentEnroll() {
  const navigate = useNavigate();

  const [allCourses, setAllCourses] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [dayFilter, setDayFilter] = useState("");
  const [semFilter, setSemFilter] = useState("");
  const [page, setPage] = useState(1);
  const [enrollingId, setEnrollingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchCourses = useCallback(() => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({
      skip: (page - 1) * PAGE_SIZE,
      limit: PAGE_SIZE,
    });
    if (search) params.append("search", search);
    if (dayFilter) params.append("day", dayFilter);
    if (semFilter) params.append("semester", semFilter);
    api
      .get(`/courses/browse?${params}`)
      .then((r) => {
        setAllCourses(r.data.courses);
        setTotal(r.data.total);
      })
      .catch(() => setError("Failed to load courses"))
      .finally(() => setLoading(false));
  }, [search, dayFilter, semFilter, page]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    setPage(1);
  }, [search, dayFilter, semFilter]);

  const handleEnroll = async (course) => {
    setEnrollingId(course.id);
    setError("");
    setSuccess("");
    try {
      await api.post("/courses/enroll", { course_code: course.course_code });
      setSuccess(`Enrolled in ${course.name}!`);
      fetchCourses();
    } catch (err) {
      setError(err.response?.data?.detail || "Enrollment failed");
    } finally {
      setEnrollingId(null);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setDayFilter("");
    setSemFilter("");
    setPage(1);
  };

  const hasActiveFilters = search || dayFilter || semFilter;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="flex h-screen bg-[#F3F4F6] font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-700 to-slate-800 h-64 relative px-10 pt-10 pb-24">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <FiPlusCircle
                className="bg-white/10 p-1.5 rounded-lg"
                size={36}
              />
              Join a Course
            </h1>
            <p className="text-slate-300 opacity-90 pl-1">
              Browse all available courses and enroll in one click
            </p>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
        </div>

        <div className="px-10 -mt-20 pb-10 relative z-20">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 min-h-[600px] flex flex-col gap-6">
            <div className="flex flex-wrap gap-4 items-center border-b border-gray-100 pb-6">
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3 flex-1 min-w-[280px] border border-gray-200 transition-colors focus-within:border-blue-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100">
                <FiSearch size={16} className="text-gray-400 shrink-0" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by course name or code…"
                  className="flex-1 bg-transparent text-sm outline-none text-gray-700 placeholder-gray-400 font-medium"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="text-gray-400 hover:text-slate-600 transition"
                  >
                    <FiX size={14} />
                  </button>
                )}
              </div>
              <div className="relative min-w-[140px]">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <FiCalendar size={14} className="text-gray-400" />
                </div>
                <select
                  value={dayFilter}
                  onChange={(e) => setDayFilter(e.target.value)}
                  className="w-full appearance-none bg-gray-50 text-gray-700 font-bold pl-9 pr-10 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer text-sm"
                >
                  <option value="">All</option>
                  {DAYS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <FiChevronDown className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" />
              </div>
              <div className="relative min-w-[150px]">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <FiFilter size={14} className="text-gray-400" />
                </div>
                <select
                  value={semFilter}
                  onChange={(e) => setSemFilter(e.target.value)}
                  className="w-full appearance-none bg-gray-50 text-gray-700 font-bold pl-9 pr-10 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer text-sm"
                >
                  <option value="">All Semesters</option>
                  {SEMESTERS.map((s) => (
                    <option key={s} value={s}>
                      Semester {s}
                    </option>
                  ))}
                </select>
                <FiChevronDown className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" />
              </div>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 transition px-2"
                >
                  Clear
                </button>
              )}
              <div className="flex items-center gap-3 ml-auto">
                <span className="text-sm text-gray-400 font-medium bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                  {total} courses
                </span>
                <button
                  onClick={fetchCourses}
                  className="p-3 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-500 transition border border-gray-200"
                  title="Refresh"
                >
                  <FiRefreshCw
                    size={14}
                    className={loading ? "animate-spin" : ""}
                  />
                </button>
              </div>
            </div>

            {success && (
              <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-200 px-4 py-3 rounded-xl -mt-2">
                <FiCheckCircle size={16} />
                <span className="text-sm font-semibold">{success}</span>
                <button
                  onClick={() => setSuccess("")}
                  className="ml-auto text-emerald-400 hover:text-emerald-600"
                >
                  <FiX size={14} />
                </button>
              </div>
            )}
            {error && (
              <div className="flex items-center gap-2 text-rose-600 bg-rose-50 border border-rose-200 px-4 py-3 rounded-xl -mt-2">
                <FiAlertCircle size={16} />
                <span className="text-sm font-semibold">{error}</span>
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-gray-100 p-5 animate-pulse h-48 bg-gray-50"
                  />
                ))}
              </div>
            ) : allCourses.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-4 py-12">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100">
                  <FiBook size={32} className="opacity-20" />
                </div>
                <p className="text-sm font-medium">
                  {hasActiveFilters
                    ? "No courses match your search"
                    : "No courses available at the moment"}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-blue-600 font-bold text-xs hover:underline"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {allCourses.map((c) => (
                  <CourseCard
                    key={c.id}
                    course={c}
                    onEnroll={() => handleEnroll(c)}
                    enrolling={enrollingId === c.id}
                  />
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex justify-between items-center pt-4 border-t border-gray-100 mt-auto">
                <span className="text-sm text-gray-400">
                  Page {page} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="w-9 h-9 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
                  >
                    <FiChevronLeft size={14} />
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
                          ? "bg-slate-700 text-white shadow-md shadow-slate-200"
                          : "border border-gray-200 text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="w-9 h-9 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
                  >
                    <FiChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function CourseCard({ course, onEnroll, enrolling }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 flex flex-col gap-3 hover:border-slate-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
              {course.course_code}
            </span>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
              Sec {course.section}
            </span>
            {course.enrolled && (
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md flex items-center gap-1 uppercase tracking-wider border border-emerald-100">
                <FiCheckCircle size={10} /> Enrolled
              </span>
            )}
          </div>
          <p className="font-bold text-gray-800 text-base leading-tight group-hover:text-slate-800 line-clamp-2">
            {course.name}
          </p>
        </div>
        <span className="shrink-0 text-xs font-bold text-slate-500 bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg">
          Sem {course.semester}
        </span>
      </div>

      <div className="space-y-2 text-xs text-gray-500 mt-2">
        <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
          <FiCalendar size={12} className="shrink-0 text-slate-400" />
          <span className="font-medium text-slate-600">
            {course.day_of_week} · {course.start_time.slice(0, 5)}–
            {course.end_time.slice(0, 5)}
          </span>
        </div>
        <div className="flex items-center gap-2 px-1">
          <FiUser size={12} className="shrink-0 text-gray-400" />
          <span className="font-medium">{course.teacher_name}</span>
        </div>
      </div>

      <div className="mt-auto pt-4">
        {course.enrolled ? (
          <div className="w-full py-2.5 flex items-center justify-center gap-2 text-emerald-600 bg-emerald-50 rounded-xl text-sm font-bold border border-emerald-100">
            <FiCheckCircle size={16} /> Already Enrolled
          </div>
        ) : (
          <button
            onClick={onEnroll}
            disabled={enrolling}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-sm shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {enrolling ? (
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <FiPlusCircle size={16} /> Enroll Now
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
