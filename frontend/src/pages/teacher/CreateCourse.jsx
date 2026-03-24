import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import Sidebar from "../../components/Sidebar";
import {
  FiBook,
  FiClock,
  FiCalendar,
  FiCheck,
  FiStar,
  FiAlertCircle,
  FiPlus,
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

export default function CreateCourse() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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
    use_late_absent: true,
    use_scoring: true,
    score_present: 1.0,
    score_late: 0.5,
    attendance_threshold: 80,
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const isTimingValid =
    !form.use_late_absent ||
    form.absent_after_minutes > form.late_after_minutes;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isTimingValid) return;
    setLoading(true);
    try {
      const payload = {
        ...form,
        late_after_minutes: form.use_late_absent
          ? form.late_after_minutes
          : 9999,
        absent_after_minutes: form.use_late_absent
          ? form.absent_after_minutes
          : 9999,
      };
      await api.post("/courses/", payload);
      navigate("/teacher/dashboard", {
        state: { message: "Course created successfully!" },
      });
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to create course");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#F3F4F6] font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-700 to-slate-900 h-64 relative px-4 sm:px-10 pt-10">
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <FiPlus className="bg-white/10 p-1.5 rounded-lg" size={36} />
                Create New Course
              </h1>
              <p className="text-slate-300 opacity-80 text-sm">
                A new session will be created automatically each time you press
                Start
              </p>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
        </div>

        <div className="px-4 sm:px-10 -mt-16 pb-10 relative z-20">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-7xl mx-auto space-y-6"
          >
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7">
              <SectionTitle
                icon={<FiBook size={14} />}
                color="bg-blue-100 text-blue-600"
              >
                Course Information
              </SectionTitle>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
                <div>
                  <label className="fl">Code</label>
                  <input
                    required
                    placeholder="Enter course code"
                    value={form.course_code}
                    onChange={(e) => set("course_code", e.target.value)}
                    className="fi"
                  />
                </div>
                <div>
                  <label className="fl">Section</label>
                  <input
                    required
                    placeholder="Enter section"
                    value={form.section}
                    onChange={(e) => set("section", e.target.value)}
                    className="fi text-center"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="fl">Course Name</label>
                  <input
                    required
                    placeholder="Enter course name"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    className="fi"
                  />
                </div>
              </div>
              <div className="border-t border-gray-100 my-5" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                <div>
                  <label className="fl">
                    <span className="flex items-center gap-1.5">
                      <FiCalendar size={12} className="mt-[-1px]" /> Semester
                    </span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {["1", "2", "Summer"].map((s) => (
                      <div
                        key={s}
                        onClick={() => set("semester", s)}
                        className={`cursor-pointer rounded-xl py-2 text-center text-sm font-bold border transition-all ${
                          form.semester === s
                            ? "bg-blue-600 text-white border-blue-600"
                            : "border-gray-200 text-gray-500 hover:border-blue-300"
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
              <div className="border-t border-gray-100 my-5" />

              <div>
                <label className="fl mb-3">
                  <span className="flex items-center gap-1.5">
                    <FiClock size={12} className="mt-[-1px]" /> Class Schedule
                  </span>
                </label>
                <div className="flex gap-1.5 flex-wrap mb-4">
                  {DAYS.map((d) => (
                    <button
                      type="button"
                      key={d.value}
                      onClick={() => set("day_of_week", d.value)}
                      className={`w-10 h-9 rounded-full text-xs font-bold transition-all ${
                        form.day_of_week === d.value
                          ? "bg-orange-500 text-white"
                          : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                <SectionTitle
                  icon={<FiClock size={14} />}
                  color="bg-teal-100 text-teal-600"
                >
                  Attendance Timing
                </SectionTitle>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs font-bold text-gray-500">
                    {form.use_late_absent
                      ? "Late & Absent"
                      : "Present / Absent only"}
                  </span>
                  <div
                    onClick={() =>
                      set("use_late_absent", !form.use_late_absent)
                    }
                    className={`w-11 h-6 rounded-full transition-all relative ${
                      form.use_late_absent ? "bg-teal-500" : "bg-gray-200"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
                        form.use_late_absent ? "left-5" : "left-0.5"
                      }`}
                    />
                  </div>
                </label>
              </div>
              <p className="text-xs text-gray-400 mb-5 font-medium">
                Timing starts from the moment the teacher presses{" "}
                <span className="font-bold text-blue-600">Start Session</span> —
                not from the scheduled class time.
              </p>

              {form.use_late_absent ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                          className={`fi w-24 text-center text-lg font-black ${!isTimingValid ? "border-rose-400 bg-rose-50" : ""}`}
                        />
                        <span className="text-sm font-bold text-rose-600">
                          min after start
                        </span>
                      </div>
                    </div>
                  </div>
                  {!isTimingValid && (
                    <div className="mt-3 flex items-center gap-2 text-rose-600 text-xs font-semibold bg-rose-50 border border-rose-200 px-4 py-2 rounded-xl">
                      <FiAlertCircle size={14} /> Absent threshold must be
                      greater than Late threshold
                    </div>
                  )}
                  {isTimingValid && (
                    <div className="mt-4 relative hidden sm:block">
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
                        <div
                          className="bg-emerald-400 h-full transition-all"
                          style={{
                            width: `${(form.late_after_minutes / form.absent_after_minutes) * 100}%`,
                          }}
                        />
                        <div className="bg-orange-400 h-full flex-1" />
                      </div>
                      <div className="flex justify-between text-xs text-gray-400 mt-1 font-medium">
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
                </>
              ) : (
                <div className="rounded-2xl p-5 border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                    <span className="text-sm font-bold text-emerald-700">
                      Present / Absent only
                    </span>
                  </div>
                  <p className="text-xs text-emerald-600 leading-relaxed">
                    Students can check in anytime = <strong>Present</strong>
                    <br />
                    Students who do not check in before the teacher presses{" "}
                    <strong>End Session</strong> = <strong>Absent</strong>
                  </p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
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
                    className={`w-11 h-6 rounded-full transition-all relative ${form.use_scoring ? "bg-blue-500" : "bg-gray-200"}`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.use_scoring ? "left-5" : "left-0.5"}`}
                    />
                  </div>
                </label>
              </div>
              {form.use_scoring ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                      <label className="fl text-orange-500">Late Score</label>
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
                      <label className="fl text-blue-600">Pass Threshold</label>
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
                  Scoring is disabled — attendance will be tracked as Present /
                  Late / Absent only
                </div>
              )}
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button
                type="button"
                onClick={() => navigate("/teacher/dashboard")}
                className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !isTimingValid}
                className="px-8 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {loading ? (
                  "Creating..."
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
          .fi:focus { background:white; border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,0.1); }
        `}</style>
      </main>
    </div>
  );
}

function SectionTitle({ icon, color, children }) {
  return (
    <h3 className="text-base font-bold text-gray-800 mb-0 sm:mb-5 flex items-center gap-2">
      <span
        className={`w-7 h-7 rounded-lg ${color} flex items-center justify-center`}
      >
        {icon}
      </span>
      {children}
    </h3>
  );
}
