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

const ROOMS = [];

const DeviceSetup = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [courses, setCourses] = useState([]);
  const [devices, setDevices] = useState([]);

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState("");
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
    if (!selectedRoom.trim()) {
      setError("Please specify a classroom");
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
        <div className="bg-gradient-to-r from-blue-700 to-slate-900 h-64 relative px-10 pt-10 pb-24">
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
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col justify-center gap-2">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FiBook size={22} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Course
                  </p>
                  <p className="text-sm text-gray-500">
                    Please select a course
                  </p>
                </div>
              </div>
              <div className="relative flex items-center">
                <select
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm font-medium text-gray-700 border border-transparent focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition appearance-none pr-10 cursor-pointer"
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
                <FiChevronDown
                  className="absolute right-4 text-gray-400 pointer-events-none"
                  size={20}
                />
              </div>
            </div>

            {/* Room */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col justify-center gap-2">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-12 h-12 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center">
                  <FiMapPin size={22} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Classroom
                  </p>
                  <p className="text-sm text-gray-500">Type or select a room</p>
                </div>
              </div>
              <input
                type="text"
                list="room-options"
                placeholder="Enter the room number"
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm font-medium text-gray-700 border border-transparent focus:border-pink-400 focus:ring-2 focus:ring-pink-100 outline-none transition"
              />
              <datalist id="room-options">
                {ROOMS.map((r) => (
                  <option key={r} value={r} />
                ))}
              </datalist>
            </div>

            {/* Camera */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col justify-center gap-2">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
                  <FiMonitor size={22} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Camera
                  </p>
                  <p className="text-sm text-gray-500">
                    {devices.length > 0
                      ? `${devices.length} camera(s) found`
                      : "No camera found"}
                  </p>
                </div>
              </div>
              <div className="relative flex items-center">
                <select
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm font-medium text-gray-700 border border-transparent focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition appearance-none pr-10 cursor-pointer"
                  onChange={(e) => setSelectedDevice(e.target.value)}
                  value={selectedDevice}
                >
                  {devices.length === 0 && (
                    <option value="" disabled>
                      No camera found
                    </option>
                  )}
                  {devices.map((d, i) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Camera ${i + 1}`}
                    </option>
                  ))}
                </select>
                <FiChevronDown
                  className="absolute right-4 text-gray-400 pointer-events-none"
                  size={20}
                />
              </div>
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
                placeholder="Enter the topic [Optional]"
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
            {loading ? "Starting Class..." : "START SESSION"}
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

export default DeviceSetup;
