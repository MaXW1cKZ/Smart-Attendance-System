import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import Sidebar from "../../components/Sidebar";
import {
  FiBook,
  FiClock,
  FiCalendar,
  FiCheck,
  FiX,
  FiStar,
  FiPercent,
  FiAlertCircle,
  FiUser,
  FiPlusSquare,
  FiSearch,
  FiChevronDown,
} from "react-icons/fi";

const DAYS = [
  { label: "Mon", value: "Monday" },
  { label: "Tue", value: "Tuesday" },
  { label: "Wed", value: "Wednesday" },
  { label: "Thu", value: "Thursday" },
  { label: "Fri", value: "Friday" },
  { label: "Sat", value: "Saturday" },
  { label: "Sun", value: "Sunday" },
];

function TeacherPicker({ teachers, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);

  const selected = teachers.find((t) => String(t.id) === String(value));

  const filtered = teachers.filter((t) => {
    const q = query.toLowerCase();
    return (
      (t.full_name || t.username || "").toLowerCase().includes(q) ||
      (t.email || "").toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const pick = (t) => {
    onChange(String(t.id));
    setQuery("");
    setOpen(false);
  };

  const clear = (e) => {
    e.stopPropagation();
    onChange("");
    setQuery("");
  };

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <div
        onClick={() => setOpen((o) => !o)}
        className={`fi flex items-center justify-between cursor-pointer select-none ${
          open
            ? "bg-white border-slate-500 shadow-[0_0_0_3px_rgba(100,116,139,0.1)]"
            : ""
        }`}
      >
        {selected ? (
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs shrink-0">
              {(selected.full_name ||
                selected.username ||
                "?")[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate leading-tight">
                {selected.full_name || selected.username}
              </p>
              <p className="text-xs text-gray-400 truncate">{selected.email}</p>
            </div>
          </div>
        ) : (
          <span className="text-gray-400 text-sm font-normal">
            — Select a Teacher —
          </span>
        )}
        <div className="flex items-center gap-1 shrink-0 ml-2">
          {selected && (
            <button
              type="button"
              onClick={clear}
              className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
            >
              <FiX size={12} />
            </button>
          )}
          <FiChevronDown
            size={14}
            className={`text-gray-400 transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        </div>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-gray-100">
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
              <FiSearch size={13} className="text-gray-400 shrink-0" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or email…"
                className="flex-1 bg-transparent text-sm outline-none text-gray-700 placeholder-gray-400"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX size={12} />
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <ul className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-gray-400">
                No teachers found
              </li>
            ) : (
              filtered.map((t) => (
                <li
                  key={t.id}
                  onClick={() => pick(t)}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition hover:bg-slate-50 ${
                    String(t.id) === String(value) ? "bg-slate-50" : ""
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs shrink-0">
                    {(t.full_name || t.username || "?")[0].toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {t.full_name || t.username}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{t.email}</p>
                  </div>
                  {String(t.id) === String(value) && (
                    <FiCheck size={14} className="text-slate-600 shrink-0" />
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function AdminCreateCourse() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [error, setError] = useState("");
  const currentYear = new Date().getFullYear();

  const [form, setForm] = useState({
    course_code: "",
    section: "",
    name: "",
    semester: "1",
    academic_year: String(currentYear),
    day_of_week: "Monday",
    start_time: "09:00",
    end_time: "12:00",
    late_after_minutes: 15,
    absent_after_minutes: 60,
    use_scoring: true,
    score_present: 1.0,
    score_late: 0.5,
    attendance_threshold: 80,
    teacher_id: "",
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    api
      .get("/admin/users?limit=200&role=teacher")
      .then((res) => {
        const data =
          res.data.users ?? res.data.items ?? res.data.data ?? res.data;
        if (Array.isArray(data)) {
          setTeachers(data.filter((u) => u.role?.toLowerCase() === "teacher"));
        }
      })
      .catch((err) => console.error("Failed to fetch teachers:", err));
  }, []);

  const isTimingValid = form.absent_after_minutes > form.late_after_minutes;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!isTimingValid) {
      setError("Absent threshold must be greater than Late threshold.");
      return;
    }
    if (!form.teacher_id) {
      setError("Please assign a teacher to this course.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        late_after_minutes: Number(form.late_after_minutes),
        absent_after_minutes: Number(form.absent_after_minutes),
        score_present: Number(form.score_present),
        score_late: Number(form.score_late),
        attendance_threshold: Number(form.attendance_threshold),
        teacher_id: Number(form.teacher_id),
      };
      await api.post("/admin/courses", payload);
      navigate("/admin/courses");
    } catch (err) {
      setError(
        err.response?.data?.detail || err.message || "Failed to create course",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#F3F4F6] font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 h-64 relative px-10 pt-10">
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <FiPlusSquare
                  className="bg-white/10 p-1.5 rounded-lg"
                  size={36}
                />
                Create New Course
              </h1>
              <p className="text-slate-300 opacity-80 text-sm">
                System overview — Set up a new course and assign it to a teacher
              </p>
            </div>
            <button
              onClick={() => navigate("/admin/courses")}
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white p-2 rounded-xl transition"
            >
              <FiX size={22} />
            </button>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
        </div>

        <div className="px-10 -mt-16 pb-10 relative z-20">
          {error && (
            <div className="mb-4 bg-rose-50 px-5 py-3 flex items-center gap-3 text-rose-600 border border-rose-100 rounded-2xl">
              <FiAlertCircle className="shrink-0" />
              <p className="text-sm font-semibold">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* ── Left ── */}
              <div className="lg:col-span-2 space-y-5">
                {/* Assign Teacher */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7">
                  <SectionTitle
                    icon={<FiUser size={14} />}
                    color="bg-slate-100 text-slate-600"
                  >
                    Assign Teacher
                  </SectionTitle>
                  <TeacherPicker
                    teachers={teachers}
                    value={form.teacher_id}
                    onChange={(v) => set("teacher_id", v)}
                  />
                  {teachers.length === 0 && (
                    <p className="mt-2 text-xs text-gray-400 font-medium">
                      Loading teachers…
                    </p>
                  )}
                </div>

                {/* Course Info */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7">
                  <SectionTitle
                    icon={<FiBook size={14} />}
                    color="bg-slate-100 text-slate-600"
                  >
                    Course Information
                  </SectionTitle>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <label className="fl">Code</label>
                      <input
                        required
                        placeholder="CS101"
                        value={form.course_code}
                        onChange={(e) => set("course_code", e.target.value)}
                        className="fi"
                      />
                    </div>
                    <div>
                      <label className="fl">Section</label>
                      <input
                        required
                        placeholder="1"
                        value={form.section}
                        onChange={(e) => set("section", e.target.value)}
                        className="fi text-center"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="fl">Course Name</label>
                      <input
                        required
                        placeholder="Introduction to Computer Science"
                        value={form.name}
                        onChange={(e) => set("name", e.target.value)}
                        className="fi"
                      />
                    </div>
                  </div>
                </div>

                {/* Timing */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7">
                  <SectionTitle
                    icon={<FiClock size={14} />}
                    color="bg-teal-100 text-teal-600"
                  >
                    Attendance Timing
                  </SectionTitle>
                  <p className="text-xs text-gray-400 mb-5 font-medium">
                    Timing starts from the moment the teacher presses{" "}
                    <span className="font-bold text-slate-600">
                      Start Session
                    </span>{" "}
                    — not from the scheduled class time.
                  </p>
                  <div className="grid grid-cols-2 gap-5">
                    <div className="bg-orange-50 rounded-2xl p-5 border border-orange-100">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-3 h-3 rounded-full bg-orange-400" />
                        <span className="text-sm font-bold text-orange-700">
                          Late Threshold
                        </span>
                      </div>
                      <p className="text-xs text-orange-500 mb-3">
                        Students checking in after this time are marked{" "}
                        <strong>Late</strong>
                      </p>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min="1"
                          max="180"
                          value={form.late_after_minutes}
                          onChange={(e) =>
                            set(
                              "late_after_minutes",
                              parseInt(e.target.value) || 1,
                            )
                          }
                          className="fi w-24 text-center text-lg font-black"
                        />
                        <span className="text-sm font-bold text-orange-600">
                          min after start
                        </span>
                      </div>
                    </div>
                    <div className="bg-rose-50 rounded-2xl p-5 border border-rose-100">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-3 h-3 rounded-full bg-rose-400" />
                        <span className="text-sm font-bold text-rose-700">
                          Absent Threshold
                        </span>
                      </div>
                      <p className="text-xs text-rose-500 mb-3">
                        Check-in is <strong>locked</strong> after this time —
                        student is Absent
                      </p>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min="1"
                          max="300"
                          value={form.absent_after_minutes}
                          onChange={(e) =>
                            set(
                              "absent_after_minutes",
                              parseInt(e.target.value) || 1,
                            )
                          }
                          className={`fi w-24 text-center text-lg font-black ${
                            !isTimingValid ? "border-rose-400 bg-rose-50" : ""
                          }`}
                        />
                        <span className="text-sm font-bold text-rose-600">
                          min after start
                        </span>
                      </div>
                    </div>
                  </div>
                  {!isTimingValid && (
                    <div className="mt-3 flex items-center gap-2 text-rose-600 text-xs font-semibold bg-rose-50 border border-rose-200 px-4 py-2 rounded-xl">
                      <FiAlertCircle size={14} />
                      Absent threshold must be greater than Late threshold
                    </div>
                  )}
                  {isTimingValid && (
                    <div className="mt-4">
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
                        <div
                          className="bg-emerald-400 h-full transition-all"
                          style={{
                            width: `${
                              (form.late_after_minutes /
                                form.absent_after_minutes) *
                              100
                            }%`,
                          }}
                        />
                        <div className="bg-orange-400 h-full flex-1" />
                      </div>
                      <div className="flex justify-between text-xs mt-1 font-medium">
                        <span className="text-emerald-600 font-bold">
                          ▶ Start (Present)
                        </span>
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

                {/* Scoring */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7">
                  <div className="flex items-center justify-between mb-5">
                    <SectionTitle
                      icon={<FiStar size={14} />}
                      color="bg-amber-100 text-amber-600"
                    >
                      Attendance Scoring
                    </SectionTitle>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-xs font-bold text-gray-500">
                        {form.use_scoring ? "Enabled" : "Disabled"}
                      </span>
                      <div
                        onClick={() => set("use_scoring", !form.use_scoring)}
                        className={`w-11 h-6 rounded-full transition-all relative ${
                          form.use_scoring ? "bg-slate-600" : "bg-gray-200"
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
                            form.use_scoring ? "left-5" : "left-0.5"
                          }`}
                        />
                      </div>
                    </label>
                  </div>
                  {form.use_scoring ? (
                    <>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="fl text-emerald-600">
                            Present Score
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              max="10"
                              value={form.score_present}
                              onChange={(e) =>
                                set("score_present", parseFloat(e.target.value))
                              }
                              className="fi pr-10"
                            />
                            <span className="absolute right-3 top-3 text-xs text-gray-400">
                              pt
                            </span>
                          </div>
                        </div>
                        <div>
                          <label className="fl text-orange-500">
                            Late Score
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              max="10"
                              value={form.score_late}
                              onChange={(e) =>
                                set("score_late", parseFloat(e.target.value))
                              }
                              className="fi pr-10"
                            />
                            <span className="absolute right-3 top-3 text-xs text-gray-400">
                              pt
                            </span>
                          </div>
                        </div>
                        <div>
                          <label className="fl text-slate-600 flex items-center gap-1">
                            <FiPercent size={11} /> Pass Threshold
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              step="5"
                              min="0"
                              max="100"
                              value={form.attendance_threshold}
                              onChange={(e) =>
                                set(
                                  "attendance_threshold",
                                  parseInt(e.target.value),
                                )
                              }
                              className="fi pr-8"
                            />
                            <span className="absolute right-3 top-3 text-xs text-gray-400">
                              %
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-3 font-medium">
                        Absent = 0 pts always
                      </p>
                    </>
                  ) : (
                    <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-400 font-medium text-center">
                      Scoring is disabled — attendance will be tracked as
                      Present / Late / Absent only
                    </div>
                  )}
                </div>
              </div>

              {/* ── Right ── */}
              <div className="space-y-5">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <SectionTitle
                    icon={<FiCalendar size={14} />}
                    color="bg-purple-100 text-purple-600"
                  >
                    Academic Term
                  </SectionTitle>
                  <div className="space-y-4">
                    <div>
                      <label className="fl">Semester</label>
                      <div className="grid grid-cols-3 gap-2">
                        {["1", "2", "Summer"].map((s) => (
                          <div
                            key={s}
                            onClick={() => set("semester", s)}
                            className={`cursor-pointer rounded-xl py-2 text-center text-sm font-bold border transition-all ${
                              form.semester === s
                                ? "bg-slate-700 text-white border-slate-700"
                                : "border-gray-200 text-gray-500 hover:border-slate-400"
                            }`}
                          >
                            {s}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="fl">Academic Year</label>
                      <input
                        type="text"
                        value={form.academic_year}
                        onChange={(e) => set("academic_year", e.target.value)}
                        className="fi"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <SectionTitle
                    icon={<FiClock size={14} />}
                    color="bg-orange-100 text-orange-600"
                  >
                    Class Schedule
                  </SectionTitle>
                  <p className="text-xs text-gray-400 mb-4 font-medium">
                    Reference only — actual session time is set when teacher
                    presses Start
                  </p>
                  <div className="mb-5">
                    <label className="fl mb-2 block">Teaching Day</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {DAYS.map((d) => (
                        <button
                          type="button"
                          key={d.value}
                          onClick={() => set("day_of_week", d.value)}
                          className={`w-10 h-9 rounded-full text-xs font-bold transition-all ${
                            form.day_of_week === d.value
                              ? "bg-slate-700 text-white"
                              : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                          }`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="fl">Start Time</label>
                      <input
                        type="time"
                        value={form.start_time}
                        onChange={(e) => set("start_time", e.target.value)}
                        className="fi"
                      />
                    </div>
                    <div>
                      <label className="fl">End Time</label>
                      <input
                        type="time"
                        value={form.end_time}
                        onChange={(e) => set("end_time", e.target.value)}
                        className="fi"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-4 mt-6">
              <button
                type="button"
                onClick={() => navigate("/admin/courses")}
                className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !isTimingValid || !form.teacher_id}
                className="px-8 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-slate-700 to-slate-800 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {loading ? (
                  "Creating…"
                ) : (
                  <>
                    <FiCheck size={18} /> Create Course
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <style>{`
          .fl { display:block; font-size:0.7rem; font-weight:700; color:#9ca3af; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:0.375rem; }
          .fi { width:100%; padding:0.625rem 0.875rem; background:#f9fafb; border:1.5px solid transparent; border-radius:0.75rem; font-weight:600; color:#374151; font-size:0.875rem; outline:none; transition:all 0.15s; }
          .fi:focus { background:white; border-color:#64748b; box-shadow:0 0 0 3px rgba(100,116,139,0.1); }
        `}</style>
      </main>
    </div>
  );
}

function SectionTitle({ icon, color, children }) {
  return (
    <h3 className="text-base font-bold text-gray-800 mb-5 flex items-center gap-2">
      <span
        className={`w-7 h-7 rounded-lg ${color} flex items-center justify-center`}
      >
        {icon}
      </span>
      {children}
    </h3>
  );
}
