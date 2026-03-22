import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import Sidebar from "../../components/Sidebar";
import {
  FiArrowLeft,
  FiSettings,
  FiCalendar,
  FiUsers,
  FiClock,
  FiCheck,
  FiAlertCircle,
  FiStar,
  FiPercent,
  FiRefreshCw,
  FiSearch,
  FiDownload,
  FiTrash2,
  FiEdit,
  FiCheckCircle,
  FiUserPlus,
  FiX,
} from "react-icons/fi";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function ConfirmModal({
  title,
  message,
  confirmLabel = "Confirm",
  danger = false,
  onConfirm,
  onCancel,
  children,
}) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${danger ? "bg-rose-100 text-rose-500" : "bg-blue-100 text-blue-600"}`}
        >
          <FiAlertCircle size={28} />
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
        {message && <p className="text-gray-500 text-sm mb-2">{message}</p>}
        {children}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border border-gray-200 font-bold text-gray-500 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 rounded-xl text-white font-bold shadow-md transition ${danger ? "bg-rose-500 hover:bg-rose-600 shadow-rose-200" : "bg-blue-600 hover:bg-blue-700 shadow-blue-200"}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminManageCourse() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("settings");
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/admin/courses?limit=9999")
      .then((r) => {
        const found = (r.data.courses || []).find(
          (c) => String(c.id) === String(courseId),
        );
        setCourse(found || null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [courseId]);

  const TABS = [
    { id: "settings", label: "Settings", icon: <FiSettings size={14} /> },
    { id: "sessions", label: "Sessions", icon: <FiCalendar size={14} /> },
    { id: "students", label: "Students", icon: <FiUsers size={14} /> },
  ];

  if (loading)
    return (
      <div className="flex h-screen bg-[#F3F4F6] font-sans">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center text-gray-400 gap-2">
          <FiRefreshCw className="animate-spin" /> Loading...
        </main>
      </div>
    );

  if (!course)
    return (
      <div className="flex h-screen bg-[#F3F4F6] font-sans">
        <Sidebar />
        <main className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-4">
          <FiAlertCircle size={48} className="opacity-20" />
          <p className="font-medium">Course not found</p>
          <button
            onClick={() => navigate("/admin/courses")}
            className="text-blue-600 font-bold text-sm hover:underline"
          >
            Back to courses
          </button>
        </main>
      </div>
    );

  return (
    <div className="flex h-screen bg-[#F3F4F6] font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 h-64 relative px-10 pt-10 pb-24">
          <div className="relative z-10">
            <button
              onClick={() => navigate("/admin/courses")}
              className="flex items-center gap-2 text-slate-300 hover:text-white text-sm font-semibold mb-4 transition-colors"
            >
              <FiArrowLeft size={16} /> Back to courses
            </button>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-bold bg-white/20 text-white px-2.5 py-1 rounded-lg">
                {course.course_code}
              </span>
              <span className="text-xs text-slate-300 font-semibold">
                Sec {course.section} · Sem {course.semester} ·{" "}
                {course.academic_year}
              </span>
              {course.teacher_name && (
                <span className="text-xs text-slate-400 font-medium">
                  · {course.teacher_name}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-white">{course.name}</h1>
            <p className="text-slate-300 text-sm mt-1">
              {course.day_of_week} ·{" "}
              {String(course.start_time || "").slice(0, 5)}–
              {String(course.end_time || "").slice(0, 5)}
            </p>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
        </div>

        <div className="px-10 -mt-20 pb-10 relative z-20">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 min-h-[600px] flex flex-col">
            <div className="flex border-b border-gray-100 px-8 pt-6">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all -mb-px ${
                    activeTab === tab.id
                      ? "border-slate-700 text-slate-700"
                      : "border-transparent text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 p-8">
              {activeTab === "settings" && (
                <SettingsTab
                  course={course}
                  onSaved={setCourse}
                  onDeleted={() => navigate("/admin/courses")}
                />
              )}
              {activeTab === "sessions" && <SessionsTab courseId={courseId} />}
              {activeTab === "students" && (
                <StudentsTab
                  courseId={courseId}
                  courseName={course.name}
                  courseCode={course.course_code}
                />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ══════════════════════════════════════════
   TAB 1: SETTINGS
══════════════════════════════════════════ */
function SettingsTab({ course, onSaved, onDeleted }) {
  const [form, setForm] = useState({
    name: course.name,
    section: course.section,
    day_of_week: course.day_of_week,
    start_time: course.start_time?.substring(0, 5) || "09:00",
    end_time: course.end_time?.substring(0, 5) || "12:00",
    late_after_minutes: course.late_after_minutes ?? 15,
    absent_after_minutes: course.absent_after_minutes ?? 60,
    use_scoring: course.use_scoring ?? true,
    score_present: course.score_present ?? 1.0,
    score_late: course.score_late ?? 0.5,
    attendance_threshold: course.attendance_threshold ?? 80,
  });
  const [saving, setSaving] = useState(false);
  const [saveConfirm, setSaveConfirm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const isTimingValid =
    (form.absent_after_minutes || 0) > (form.late_after_minutes || 0);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch(`/admin/courses/${course.id}`, form);
      onSaved((prev) => ({ ...prev, ...form }));
      setSaveConfirm(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/courses/${course.id}`);
      onDeleted();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to delete");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {saved && (
        <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-200 px-4 py-3 rounded-xl">
          <FiCheckCircle size={16} />
          <span className="text-sm font-semibold">
            Changes saved successfully
          </span>
        </div>
      )}

      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
          Course Information
        </p>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="field-label">Course Name</label>
            <input
              className="field-input"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </div>
          <div>
            <label className="field-label">Section</label>
            <input
              className="field-input"
              value={form.section}
              onChange={(e) => set("section", e.target.value)}
            />
          </div>
        </div>
      </div>

      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
          Schedule
        </p>
        <div className="mb-4">
          <label className="field-label">Teaching Day</label>
          <div className="flex gap-2 flex-wrap">
            {DAYS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => set("day_of_week", d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${form.day_of_week === d ? "bg-slate-700 text-white border-slate-700" : "bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300"}`}
              >
                {d.substring(0, 3)}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="field-label">Start Time</label>
            <input
              type="time"
              className="field-input"
              value={form.start_time}
              onChange={(e) => set("start_time", e.target.value)}
            />
          </div>
          <div>
            <label className="field-label">End Time</label>
            <input
              type="time"
              className="field-input"
              value={form.end_time}
              onChange={(e) => set("end_time", e.target.value)}
            />
          </div>
        </div>
      </div>

      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
          Attendance Timing
        </p>
        <p className="text-xs text-gray-400 mb-4">
          Counted from the moment <strong>Start Session</strong> is pressed
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
            <label className="field-label text-orange-600">
              Late After (minutes)
            </label>
            <input
              type="number"
              min="1"
              max="180"
              className="field-input text-center font-black text-lg"
              value={form.late_after_minutes}
              onChange={(e) =>
                set("late_after_minutes", parseInt(e.target.value) || 1)
              }
            />
            <p className="text-xs text-orange-400 mt-1 font-medium">
              After this → Late
            </p>
          </div>
          <div className="bg-rose-50 rounded-xl p-4 border border-rose-100">
            <label className="field-label text-rose-600">
              Absent After (minutes)
            </label>
            <input
              type="number"
              min="1"
              max="300"
              className={`field-input text-center font-black text-lg ${!isTimingValid ? "border-rose-400" : ""}`}
              value={form.absent_after_minutes}
              onChange={(e) =>
                set("absent_after_minutes", parseInt(e.target.value) || 1)
              }
            />
            <p className="text-xs text-rose-400 mt-1 font-medium">
              After this → locked out
            </p>
          </div>
        </div>
        {!isTimingValid && (
          <div className="mt-2 flex items-center gap-2 text-rose-600 text-xs font-semibold bg-rose-50 border border-rose-200 px-3 py-2 rounded-xl">
            <FiAlertCircle size={13} /> Absent threshold must be greater than
            Late threshold
          </div>
        )}
        {isTimingValid && (
          <div className="mt-3">
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden flex">
              <div
                className="bg-emerald-400 h-full transition-all"
                style={{
                  width: `${(form.late_after_minutes / form.absent_after_minutes) * 100}%`,
                }}
              />
              <div className="bg-orange-400 h-full flex-1" />
            </div>
            <div className="flex justify-between text-xs mt-1 font-medium">
              <span className="text-emerald-600 font-bold">▶ Start</span>
              <span className="text-orange-500 font-bold">
                +{form.late_after_minutes}m Late
              </span>
              <span className="text-rose-500 font-bold">
                +{form.absent_after_minutes}m Absent
              </span>
            </div>
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <FiStar size={12} className="text-amber-500" /> Attendance Scoring
          </p>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs font-bold text-gray-500">
              {form.use_scoring ? "Enabled" : "Disabled"}
            </span>
            <div
              onClick={() => set("use_scoring", !form.use_scoring)}
              className={`w-11 h-6 rounded-full transition-all relative cursor-pointer ${form.use_scoring ? "bg-blue-500" : "bg-gray-200"}`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.use_scoring ? "left-5" : "left-0.5"}`}
              />
            </div>
          </label>
        </div>
        {form.use_scoring ? (
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="field-label text-emerald-600">
                Present Score
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="10"
                  className="field-input pr-10"
                  value={form.score_present}
                  onChange={(e) =>
                    set("score_present", parseFloat(e.target.value))
                  }
                />
                <span className="absolute right-3 top-3 text-xs text-gray-400">
                  pt
                </span>
              </div>
            </div>
            <div>
              <label className="field-label text-orange-600">Late Score</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="10"
                  className="field-input pr-10"
                  value={form.score_late}
                  onChange={(e) =>
                    set("score_late", parseFloat(e.target.value))
                  }
                />
                <span className="absolute right-3 top-3 text-xs text-gray-400">
                  pt
                </span>
              </div>
            </div>
            <div>
              <label className="field-label text-blue-700 flex items-center gap-1">
                Pass Threshold
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="5"
                  min="0"
                  max="100"
                  className="field-input pr-8"
                  value={form.attendance_threshold}
                  onChange={(e) =>
                    set("attendance_threshold", parseInt(e.target.value))
                  }
                />
                <span className="absolute right-3 top-3 text-xs text-gray-400">
                  %
                </span>
              </div>
            </div>
            <p className="col-span-3 text-xs text-blue-500 font-medium">
              💡 Absent = 0 pts always · Pass requires at least{" "}
              {form.attendance_threshold}% attendance
            </p>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-400 font-medium text-center">
            Scoring disabled — attendance tracked as Present / Late / Absent
            only
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-4 border-t border-gray-100">
        <button
          onClick={() => setDeleteConfirm(true)}
          className="px-5 py-3 rounded-xl border border-rose-200 text-rose-500 font-bold text-sm hover:bg-rose-50 transition flex items-center gap-2"
        >
          <FiTrash2 size={14} /> Delete Course
        </button>
        <button
          onClick={() => setSaveConfirm(true)}
          disabled={!isTimingValid}
          className="flex-1 py-3 rounded-xl bg-slate-700 text-white font-bold shadow-md shadow-slate-200 hover:bg-slate-800 transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <FiCheck size={16} /> Save Changes
        </button>
      </div>

      {saveConfirm && (
        <ConfirmModal
          title="Save changes?"
          message={`Update settings for ${course.course_code}: ${course.name}?`}
          confirmLabel={saving ? "Saving..." : "Save"}
          onConfirm={handleSave}
          onCancel={() => setSaveConfirm(false)}
        />
      )}
      {deleteConfirm && (
        <ConfirmModal
          title="Delete this course?"
          danger
          message={`${course.course_code}: ${course.name} — All sessions and attendance records will be permanently deleted.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(false)}
        />
      )}

      <style>{`
        .field-label { display: block; font-size: 0.7rem; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.375rem; }
        .field-input { width: 100%; padding: 0.625rem 0.875rem; background: #f9fafb; border: 1.5px solid transparent; border-radius: 0.75rem; font-weight: 600; color: #374151; font-size: 0.875rem; outline: none; transition: all 0.15s; }
        .field-input:focus { background: white; border-color: #475569; box-shadow: 0 0 0 3px rgba(71,85,105,0.1); }
      `}</style>
    </div>
  );
}

function SessionsTab({ courseId }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [saveConfirm, setSaveConfirm] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchSessions = useCallback(() => {
    setLoading(true);
    api
      .get(`/admin/courses/${courseId}/sessions`)
      .then((r) => setSessions(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [courseId]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const startEdit = (s) => {
    setEditId(s.id);
    setEditData({ topic: s.topic || "", room: s.room || "" });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch(`/sessions/${saveConfirm.id}`, editData);
      setSessions((prev) =>
        prev.map((s) => (s.id === saveConfirm.id ? { ...s, ...editData } : s)),
      );
      setEditId(null);
      setSaveConfirm(null);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/sessions/${deleteConfirm.id}`);
      setSessions((prev) => prev.filter((s) => s.id !== deleteConfirm.id));
      setDeleteConfirm(null);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to delete");
    }
  };

  const fmtTime = (iso) =>
    iso
      ? new Date(iso).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      : null;
  const fmtDate = (d) =>
    d
      ? new Date(d + "T12:00").toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : null;

  if (loading)
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 gap-2">
        <FiRefreshCw className="animate-spin" /> Loading sessions...
      </div>
    );

  if (sessions.length === 0)
    return (
      <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-3">
        <FiCalendar size={40} className="opacity-20" />
        <p className="font-medium text-sm">No sessions yet</p>
      </div>
    );

  return (
    <div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
        {sessions.length} session{sessions.length !== 1 ? "s" : ""} taught
      </p>
      <div className="space-y-2">
        {sessions.map((s) => (
          <div key={s.id}>
            {editId === s.id ? (
              <div className="border border-slate-200 bg-slate-50 rounded-2xl p-5">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Editing — Week {s.week_number}
                </p>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                      Topic
                    </label>
                    <input
                      value={editData.topic}
                      onChange={(e) =>
                        setEditData((p) => ({ ...p, topic: e.target.value }))
                      }
                      placeholder="e.g. Chapter 3: Sorting Algorithms"
                      className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                      Room
                    </label>
                    <input
                      value={editData.room}
                      onChange={(e) =>
                        setEditData((p) => ({ ...p, room: e.target.value }))
                      }
                      placeholder="e.g. M22"
                      className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-200"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditId(null)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm font-bold hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setSaveConfirm(s)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-700 text-white text-sm font-bold hover:bg-slate-800 transition flex items-center justify-center gap-1.5"
                  >
                    <FiCheck size={13} /> Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4 px-5 py-4 rounded-2xl border border-gray-100 hover:bg-gray-50/80 transition">
                <div className="shrink-0 w-12 text-center">
                  <span className="text-xs font-black text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                    W{s.week_number}
                  </span>
                  {s.is_active && (
                    <div className="flex items-center gap-1 text-[10px] font-bold text-red-500 mt-1 justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
                      Live
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 text-sm">
                    {s.topic || (
                      <span className="text-gray-300 font-normal italic text-xs">
                        No topic set
                      </span>
                    )}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5 flex-wrap">
                    {fmtDate(s.date) && <span>{fmtDate(s.date)}</span>}
                    {s.room && <span>Room {s.room}</span>}
                    {fmtTime(s.actual_start_time) && (
                      <span>
                        {fmtTime(s.actual_start_time)}
                        {s.actual_end_time
                          ? ` – ${fmtTime(s.actual_end_time)}`
                          : " (ongoing)"}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => startEdit(s)}
                    className="p-2 text-gray-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition"
                    title="Edit"
                  >
                    <FiEdit size={15} />
                  </button>
                  {!s.is_active && (
                    <button
                      onClick={() => setDeleteConfirm(s)}
                      className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"
                      title="Delete"
                    >
                      <FiTrash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {saveConfirm && (
        <ConfirmModal
          title="Save session changes?"
          message={`Update Week ${saveConfirm.week_number}?`}
          confirmLabel={saving ? "Saving..." : "Save"}
          onConfirm={handleSave}
          onCancel={() => setSaveConfirm(null)}
        >
          <div className="bg-gray-50 rounded-xl p-3 text-sm text-left space-y-2 mb-2">
            <p className="text-gray-600">
              <span className="text-xs font-bold text-gray-400 uppercase block mb-0.5">
                Topic
              </span>
              {editData.topic || (
                <span className="italic text-gray-300">Empty</span>
              )}
            </p>
            <p className="text-gray-600">
              <span className="text-xs font-bold text-gray-400 uppercase block mb-0.5">
                Room
              </span>
              {editData.room || (
                <span className="italic text-gray-300">Empty</span>
              )}
            </p>
          </div>
        </ConfirmModal>
      )}
      {deleteConfirm && (
        <ConfirmModal
          title="Delete this session?"
          danger
          message={`Week ${deleteConfirm.week_number}${deleteConfirm.topic ? ` · ${deleteConfirm.topic}` : ""} — All attendance records will be permanently deleted.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}

function StudentsTab({ courseId, courseName, courseCode }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [removeConfirm, setRemoveConfirm] = useState(null);

  const [enrollEmail, setEnrollEmail] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState("");
  const [enrollSuccess, setEnrollSuccess] = useState("");

  const fetchStudents = useCallback(() => {
    setLoading(true);
    api
      .get(`/admin/courses/${courseId}/students`)
      .then((r) => setStudents(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [courseId]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      String(s.student_id).includes(search),
  );

  const handleExport = () => {
    if (students.length === 0) return;
    const BOM = "\uFEFF";
    const rows = filtered
      .map((s, i) => `${i + 1},${s.student_id},${s.name}`)
      .join("\n");
    const blob = new Blob([BOM + "No.,Student ID,Name\n" + rows], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `students_${courseCode}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRemove = async () => {
    try {
      await api.delete(`/admin/courses/${courseId}/enroll/${removeConfirm.id}`);
      setStudents((prev) => prev.filter((s) => s.id !== removeConfirm.id));
      setRemoveConfirm(null);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to remove");
    }
  };

  const handleEnroll = async () => {
    if (!enrollEmail.trim()) return;
    setEnrolling(true);
    setEnrollError("");
    setEnrollSuccess("");
    try {
      const res = await api.post(`/admin/courses/${courseId}/enroll`, {
        student_email: enrollEmail.trim(),
      });
      setEnrollSuccess(res.data.message || "Student enrolled successfully");
      setEnrollEmail("");
      fetchStudents();
    } catch (err) {
      setEnrollError(err.response?.data?.detail || "Failed to enroll");
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-slate-700 text-white flex items-center justify-center shrink-0">
            <FiUserPlus size={13} />
          </div>
          <p className="text-sm font-bold text-slate-700">
            Enroll student by email
          </p>
        </div>
        <div className="flex gap-2">
          <input
            type="email"
            placeholder="student@email.com"
            value={enrollEmail}
            onChange={(e) => {
              setEnrollEmail(e.target.value);
              setEnrollError("");
              setEnrollSuccess("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleEnroll()}
            className="flex-1 px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
          <button
            onClick={handleEnroll}
            disabled={enrolling || !enrollEmail.trim()}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {enrolling ? (
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <FiUserPlus size={13} /> Enroll
              </>
            )}
          </button>
        </div>
        {enrollError && (
          <div className="flex items-center gap-2 text-rose-500 bg-rose-50 border border-rose-100 px-3 py-2 rounded-xl text-xs font-semibold mt-2">
            <FiAlertCircle size={12} /> {enrollError}
          </div>
        )}
        {enrollSuccess && (
          <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-xl text-xs font-semibold mt-2">
            <FiCheckCircle size={12} /> {enrollSuccess}
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <FiSearch className="absolute left-3 top-3 text-gray-400" size={14} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID or name..."
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition shadow-sm shadow-emerald-200"
        >
          <FiDownload size={14} /> Export CSV
        </button>
        <span className="flex items-center text-sm text-gray-400 font-medium bg-gray-50 px-3 rounded-xl border border-gray-100">
          {loading ? "..." : `${filtered.length} students`}
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-400 gap-2">
          <FiRefreshCw className="animate-spin" /> Loading students...
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-3">
          <FiUsers size={40} className="opacity-20" />
          <p className="font-medium text-sm">
            {search
              ? "No students match your search"
              : "No students enrolled yet"}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                <th className="pb-3 pl-4 w-12 text-center">No.</th>
                <th className="pb-3 pl-4">Student ID</th>
                <th className="pb-3">Name</th>
                <th className="pb-3 text-center w-20">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr
                  key={s.id}
                  className="border-b border-gray-50 hover:bg-gray-50/80 transition h-14"
                >
                  <td className="pl-4 text-center font-medium text-gray-300 text-xs">
                    {i + 1}
                  </td>
                  <td className="pl-4 font-mono text-sm text-gray-500 font-bold">
                    {s.student_id}
                  </td>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center font-bold text-xs shrink-0">
                        {s.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-bold text-gray-800">{s.name}</span>
                    </div>
                  </td>
                  <td className="text-center">
                    <button
                      onClick={() => setRemoveConfirm(s)}
                      className="p-2 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"
                      title="Remove from course"
                    >
                      <FiTrash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {removeConfirm && (
        <ConfirmModal
          title="Remove student?"
          danger
          message={`Remove ${removeConfirm.name} (${removeConfirm.student_id}) from this course? Their attendance records will be kept.`}
          confirmLabel="Remove"
          onConfirm={handleRemove}
          onCancel={() => setRemoveConfirm(null)}
        />
      )}
    </div>
  );
}
