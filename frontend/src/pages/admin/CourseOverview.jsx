import React, { useState, useEffect, useCallback } from "react";
import api from "../../api/axios";
import Sidebar from "../../components/Sidebar";
import {
  FiBook,
  FiSearch,
  FiTrash2,
  FiUserPlus,
  FiAlertCircle,
  FiX,
  FiCheck,
  FiRefreshCw,
  FiCalendar,
} from "react-icons/fi";

const PAGE_SIZE = 12;

export default function CourseOverview() {
  const [courses, setCourses] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [deleteCourse, setDeleteCourse] = useState(null);
  const [enrollModal, setEnrollModal] = useState(null);
  const [enrollEmail, setEnrollEmail] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState("");
  const [enrollSuccess, setEnrollSuccess] = useState("");

  const fetchCourses = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({
      skip: (page - 1) * PAGE_SIZE,
      limit: PAGE_SIZE,
    });
    if (search) params.append("search", search);
    api
      .get(`/admin/courses?${params}`)
      .then((r) => {
        setCourses(r.data.courses);
        setTotal(r.data.total);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, page]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);
  useEffect(() => {
    setPage(1);
  }, [search]);

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/courses/${deleteCourse.id}`);
      setDeleteCourse(null);
      fetchCourses();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to delete");
    }
  };

  const handleEnroll = async () => {
    if (!enrollEmail.trim()) return;
    setEnrolling(true);
    setEnrollError("");
    setEnrollSuccess("");
    try {
      const res = await api.post(`/admin/courses/${enrollModal.id}/enroll`, {
        student_email: enrollEmail.trim(),
      });
      setEnrollSuccess(res.data.message);
      setEnrollEmail("");
      fetchCourses();
    } catch (err) {
      setEnrollError(err.response?.data?.detail || "Failed to enroll");
    } finally {
      setEnrolling(false);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="flex h-screen bg-[#F3F4F6] font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 h-64 relative px-10 pt-10 pb-24">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <FiBook className="bg-white/10 p-1.5 rounded-lg" size={36} />
              Course Overview
            </h1>
            <p className="text-slate-300 opacity-90">
              All courses across every teacher · Delete · Enroll students
            </p>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
        </div>

        <div className="px-10 -mt-20 pb-10 relative z-20">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 min-h-[600px] flex flex-col">
            {/* Toolbar */}
            <div className="flex justify-between items-center mb-6 gap-4">
              <div className="relative">
                <FiSearch
                  className="absolute left-3 top-3 text-gray-400"
                  size={14}
                />
                <input
                  placeholder="Search course name or code…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2.5 bg-gray-50 rounded-xl text-sm font-medium w-72 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400 font-medium">
                  {total} courses
                </span>
                <button
                  onClick={fetchCourses}
                  className="p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-500 transition"
                >
                  <FiRefreshCw size={14} />
                </button>
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <div className="flex-1 flex items-center justify-center text-gray-400 font-medium">
                Loading…
              </div>
            ) : (
              <>
                <div className="overflow-x-auto flex-1">
                  <table className="w-full min-w-[900px] text-sm">
                    <thead>
                      <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                        <th className="pb-4 pl-4">Course</th>
                        <th className="pb-4">Instructor</th>
                        <th className="pb-4 text-center">Day</th>
                        <th className="pb-4 text-center">Students</th>
                        <th className="pb-4 text-center">Sessions</th>
                        <th className="pb-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courses.map((c) => (
                        <tr
                          key={c.id}
                          className="border-b border-gray-50 hover:bg-gray-50 transition"
                        >
                          <td className="pl-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center font-bold text-xs shrink-0">
                                {c.course_code?.substring(0, 2)}
                              </div>
                              <div>
                                <p className="font-bold text-gray-800">
                                  {c.name}
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-xs font-bold text-violet-500 bg-violet-50 px-2 py-0.5 rounded">
                                    {c.course_code}
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    Sec {c.section} · {c.semester}/
                                    {c.academic_year}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4">
                            <p className="font-semibold text-gray-700 text-sm">
                              {c.teacher_name || "—"}
                            </p>
                            <p className="text-xs text-gray-400">
                              {c.teacher_email}
                            </p>
                          </td>
                          <td className="text-center py-4">
                            <div className="flex items-center justify-center gap-1 text-xs text-gray-500 font-medium">
                              <FiCalendar size={11} />{" "}
                              {c.day_of_week?.substring(0, 3) || "—"}
                            </div>
                          </td>
                          <td className="text-center py-4">
                            <span className="bg-blue-50 text-blue-600 font-bold text-sm px-2.5 py-1 rounded-lg">
                              {c.enrollment_count}
                            </span>
                          </td>
                          <td className="text-center py-4 text-gray-600 font-bold">
                            {c.session_count}
                          </td>
                          <td className="text-center py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => {
                                  setEnrollModal(c);
                                  setEnrollEmail("");
                                  setEnrollError("");
                                  setEnrollSuccess("");
                                }}
                                className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition"
                                title="Enroll student"
                              >
                                <FiUserPlus size={14} />
                              </button>
                              <button
                                onClick={() => setDeleteCourse(c)}
                                className="p-2 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 transition"
                                title="Delete course"
                              >
                                <FiTrash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {courses.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="text-center py-12 text-gray-400 text-sm"
                          >
                            No courses found
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
                        className="w-9 h-9 flex items-center justify-center border rounded-lg hover:bg-gray-50 disabled:opacity-40 text-sm"
                      >
                        ←
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
                        className="w-9 h-9 flex items-center justify-center border rounded-lg hover:bg-gray-50 disabled:opacity-40 text-sm"
                      >
                        →
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Enroll Modal */}
      {enrollModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative">
            <button
              onClick={() => setEnrollModal(null)}
              className="absolute top-5 right-5 p-2 rounded-xl hover:bg-gray-100 text-gray-400"
            >
              <FiX size={18} />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <FiUserPlus size={18} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  Enroll Student
                </h3>
                <p className="text-xs text-gray-400">
                  {enrollModal.course_code}: {enrollModal.name}
                </p>
              </div>
            </div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">
              Student Email
            </label>
            <input
              type="email"
              placeholder="65070282@kmitl.ac.th"
              value={enrollEmail}
              onChange={(e) => {
                setEnrollEmail(e.target.value);
                setEnrollError("");
                setEnrollSuccess("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleEnroll()}
              className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-emerald-400 outline-none text-sm font-medium mb-3"
            />
            {enrollError && (
              <div className="flex items-center gap-2 text-rose-500 bg-rose-50 border border-rose-100 px-3 py-2.5 rounded-xl text-xs font-semibold mb-3">
                <FiAlertCircle size={13} /> {enrollError}
              </div>
            )}
            {enrollSuccess && (
              <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-2.5 rounded-xl text-xs font-semibold mb-3">
                <FiCheck size={13} /> {enrollSuccess}
              </div>
            )}
            <div className="flex gap-3 mt-1">
              <button
                onClick={() => setEnrollModal(null)}
                className="flex-1 py-3 rounded-xl border font-bold text-gray-500 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEnroll}
                disabled={enrolling || !enrollEmail.trim()}
                className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2 transition"
              >
                {enrolling ? (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <FiUserPlus size={14} /> Enroll
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Course Modal */}
      {deleteCourse && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center">
            <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiAlertCircle size={28} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Delete Course?
            </h3>
            <p className="text-gray-500 text-sm mb-1">
              <span className="font-bold text-gray-700">
                {deleteCourse.course_code}: {deleteCourse.name}
              </span>
            </p>
            <p className="text-xs text-rose-500 font-semibold mb-6">
              All sessions, attendance records, and enrollments will be
              permanently deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteCourse(null)}
                className="flex-1 py-3 rounded-xl border font-bold text-gray-500 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-3 rounded-xl bg-rose-500 text-white font-bold hover:bg-rose-600 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
