import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import Sidebar from "../../components/Sidebar";
import {
  FiBook,
  FiMapPin,
  FiMonitor,
  FiPlay,
  FiChevronDown,
  FiClock,
  FiLoader,
  FiAlertCircle,
  FiFileText,
} from "react-icons/fi";

const ROOMS = ["M22", "CB2301", "LX1102", "SIT-Train-1", "Online"];

const DeviceSetup = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [courses, setCourses] = useState([]);
  const [devices, setDevices] = useState([]);

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState("M22");
  const [selectedDevice, setSelectedDevice] = useState("");
  const [topic, setTopic] = useState("");

  // Clock
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Fetch my courses
  useEffect(() => {
    api
      .get("/courses/my-courses")
      .then((res) => setCourses(res.data))
      .catch(console.error);
  }, []);

  // Get cameras
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(() => navigator.mediaDevices.enumerateDevices())
      .then((all) => {
        const cams = all.filter((d) => d.kind === "videoinput");
        setDevices(cams);
        if (cams.length > 0) setSelectedDevice(cams[0].deviceId);
      })
      .catch(console.error);
  }, []);

  const handleStartClass = async () => {
    if (!selectedCourse) {
      setError("Please select a course first");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/sessions/start", {
        course_id: selectedCourse.id,
        topic: topic || null,
        room: selectedRoom,
      });

      const { session_id, week_number, course_name, course_code } = res.data;

      localStorage.setItem("active_session_id", String(session_id));
      window.dispatchEvent(new Event("storage"));

      navigate(`/teacher/session/${session_id}/live`, {
        state: {
          courseName: course_name,
          courseCode: course_code,
          weekNumber: week_number,
          deviceId: selectedDevice,
          room: selectedRoom,
        },
      });
    } catch (err) {
      setError(err.response?.data?.detail || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const todayStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex h-screen bg-[#F3F4F6] font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-slate-800 h-64 relative px-10 pt-10 pb-24">
          <div className="relative z-10 flex justify-between items-start text-white">
            <div>
              <h1 className="text-3xl font-bold mb-1">Start Attendance</h1>
              <p className="opacity-75 text-sm">{todayStr}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl flex items-center gap-3">
              <FiClock size={18} />
              <span className="text-xl font-mono font-bold tracking-widest">
                {currentTime.toLocaleTimeString("en-US", { hour12: false })}
              </span>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
        </div>

        <div className="px-10 -mt-20 relative z-20 pb-10">
          {error && (
            <div className="mb-5 flex items-center gap-3 bg-red-50 border border-red-200 text-red-600 p-4 rounded-2xl text-sm font-semibold">
              <FiAlertCircle size={18} /> {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            {/* Course */}
            <div className="relative group">
              <SelectionCard
                label="Course"
                value={
                  selectedCourse ? selectedCourse.course_code : "Select Course"
                }
                subValue={
                  selectedCourse
                    ? selectedCourse.name
                    : "Please select a course"
                }
                icon={<FiBook size={22} />}
                color="text-blue-600"
                bgColor="bg-blue-50"
              />
              <select
                className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                onChange={(e) => {
                  const c = courses.find(
                    (x) => x.id === parseInt(e.target.value),
                  );
                  setSelectedCourse(c || null);
                }}
                value={selectedCourse?.id || ""}
              >
                <option value="" disabled>
                  Select course
                </option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.course_code} — {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Room */}
            <div className="relative group">
              <SelectionCard
                label="Classroom"
                value={selectedRoom}
                subValue="Select the room for today"
                icon={<FiMapPin size={22} />}
                color="text-pink-600"
                bgColor="bg-pink-50"
              />
              <select
                className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                onChange={(e) => setSelectedRoom(e.target.value)}
                value={selectedRoom}
              >
                {ROOMS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Camera */}
            <div className="relative group">
              <SelectionCard
                label="Camera"
                value={
                  devices.find((d) => d.deviceId === selectedDevice)?.label ||
                  "Default Camera"
                }
                subValue={
                  devices.length > 0
                    ? `${devices.length} camera(s) found`
                    : "No camera found"
                }
                icon={<FiMonitor size={22} />}
                color="text-orange-600"
                bgColor="bg-orange-50"
              />
              <select
                className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                onChange={(e) => setSelectedDevice(e.target.value)}
                value={selectedDevice}
              >
                {devices.map((d, i) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || `Camera ${i + 1}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Topic */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col justify-center gap-2">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <FiFileText size={22} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Today's Topic
                  </p>
                  <p className="text-sm text-gray-500">
                    Optional — describe today's lesson
                  </p>
                </div>
              </div>
              <input
                type="text"
                placeholder="e.g. Chapter 5: Database Normalization"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm font-medium text-gray-700 border border-transparent focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition"
              />
            </div>
          </div>

          {/* Start button */}
          <button
            onClick={handleStartClass}
            disabled={!selectedCourse || loading}
            className="w-full bg-white text-slate-800 p-7 rounded-[32px] font-black text-2xl shadow-xl shadow-slate-900/10 hover:scale-[1.015] active:scale-[0.99] transition-all flex items-center justify-center gap-5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <div className="w-14 h-14 bg-slate-800 text-white rounded-full flex items-center justify-center shadow-lg shadow-slate-300">
              {loading ? (
                <FiLoader className="animate-spin" size={24} />
              ) : (
                <FiPlay fill="currentColor" size={20} />
              )}
            </div>
            {loading ? "Starting Class..." : "START ATTENDANCE"}
          </button>

          {selectedCourse && (
            <p className="text-center text-sm text-gray-400 mt-4 font-medium">
              A new session will be created automatically for{" "}
              <span className="text-blue-600 font-bold">
                {selectedCourse.course_code}
              </span>
            </p>
          )}
        </div>
      </main>
    </div>
  );
};

const SelectionCard = ({ label, value, subValue, icon, color, bgColor }) => (
  <div className="relative p-6 rounded-3xl border border-gray-100 bg-white shadow-sm flex items-center gap-4 group hover:border-gray-200 transition-all cursor-pointer">
    <div
      className={`w-14 h-14 rounded-2xl ${bgColor} ${color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}
    >
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5">
        {label}
      </p>
      <p className="font-bold text-gray-800 text-lg truncate">{value}</p>
      <p className="text-sm text-gray-500 truncate">{subValue}</p>
    </div>
    <FiChevronDown
      className="text-gray-300 group-hover:text-gray-500 transition-colors shrink-0"
      size={22}
    />
  </div>
);

export default DeviceSetup;
