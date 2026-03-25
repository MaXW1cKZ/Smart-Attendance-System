import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Webcam from "react-webcam";
import Human from "@vladmandic/human";
import api from "../../api/axios";
import {
  FiUsers,
  FiCheckCircle,
  FiStopCircle,
  FiCamera,
  FiWifi,
  FiClock,
  FiAlertCircle,
} from "react-icons/fi";
import Sidebar from "../../components/Sidebar";

const RealTimeAttendance = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const isProcessingRef = useRef(false);
  const isSessionActiveRef = useRef(true);
  const wsRef = useRef(null);
  const humanRef = useRef(null);

  const [logs, setLogs] = useState([]);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(true);
  const [statusLabel, setStatusLabel] = useState("Loading model...");
  const [faceCount, setFaceCount] = useState(0);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [courseInfo, setCourseInfo] = useState(null);
  const [isFetchingAttendance, setIsFetchingAttendance] = useState(true);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [endingSession, setEndingSession] = useState(false);

  const deviceId = location.state?.deviceId || "";
  const room = location.state?.room || sessionInfo?.room || "";
  const courseName = courseInfo?.name || "Loading Course...";
  const courseCode = courseInfo?.course_code || "";
  const weekNumber = sessionInfo?.week_number || "";

  // 1. โหลดโมเดล Human
  useEffect(() => {
    const loadHumanModel = async () => {
      try {
        const human = new Human({
          modelBasePath: "https://vladmandic.github.io/human-models/models",
          face: {
            enabled: true,
            detector: { rotation: true, maxDetected: 10 },
            mesh: { enabled: false },
            iris: { enabled: false },
            description: { enabled: false },
            emotion: { enabled: false },
            liveness: { enabled: false },
          },
          body: { enabled: false },
          hand: { enabled: false },
          object: { enabled: false },
          gesture: { enabled: false },
        });

        await human.load();
        humanRef.current = human;
        setIsModelLoaded(true);
        setStatusLabel("Connecting to server...");
      } catch (error) {
        console.error("Failed to load Human model:", error);
        setStatusLabel("Model load failed");
      }
    };
    loadHumanModel();
  }, []);

  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        const attRes = await api.get(`/sessions/${sessionId}/attendance`);
        const data = attRes.data;

        if (data.session) setSessionInfo(data.session);
        if (data.course) setCourseInfo(data.course);

        const existingLogs = (data.records || [])
          .filter((r) => r.status !== "absent")
          .map((att) => ({
            id: att.attendance_id || Math.random(),
            student_name: att.name || "Unknown",
            display_id: att.email ? att.email.split("@")[0] : att.student_id,
            time: att.timestamp
              ? new Date(att.timestamp).toLocaleTimeString("en-US", {
                  hour12: false,
                })
              : "--:--",
            confidence: att.confidence_score
              ? att.confidence_score / 100
              : null,
            status: att.status,
          }));
        setLogs(existingLogs);
      } catch (err) {
        console.error("Error fetching session:", err);
      } finally {
        setIsFetchingAttendance(false);
      }
    };
    if (sessionId) fetchSessionData();
  }, [sessionId]);

  // 3. เชื่อมต่อ WebSocket (รันเมื่อโมเดลโหลดเสร็จ)
  useEffect(() => {
    if (!sessionId || !isModelLoaded) return;

    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("access_token") ||
      "";
    const wsUrl = `ws://localhost:8000/attendance/ws/${sessionId}?token=${token}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("✅ WebSocket Connected");
      setStatusLabel("System Ready. Scanning...");
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.status === "detected") {
        const student = data.student;
        setStatusLabel(`✓ ${student.name}`);

        if (!data.already_recorded) {
          setLogs((prev) => {
            const currentDisplayId = student.email
              ? student.email.split("@")[0]
              : student.student_id;

            // ป้องกันการใส่ข้อมูลซ้ำ
            if (
              prev.find(
                (l) =>
                  l.display_id === currentDisplayId ||
                  l.student_id === student.student_id,
              )
            ) {
              return prev;
            }

            return [
              {
                id: Date.now(),
                student_name: student.name,
                student_id: student.student_id,
                display_id: currentDisplayId,
                time: new Date().toLocaleTimeString("en-US", { hour12: false }),
                confidence: student.confidence
                  ? student.confidence / 100
                  : null,
                status: student.status || "present",
              },
              ...prev,
            ];
          });
        }
      } else if (data.status === "unknown") {
        setStatusLabel("Unknown face");
      } else if (data.status === "locked") {
        setStatusLabel("Check-in Closed");
      } else {
        setStatusLabel("No face matched");
      }

      // ปลดล็อคสถานะการประมวลผล
      setTimeout(() => {
        isProcessingRef.current = false;
        if (isSessionActiveRef.current) setStatusLabel("Scanning...");
      }, 2000);
    };

    ws.onerror = (error) => console.error("❌ WebSocket Error:", error);
    ws.onclose = () => console.log("❌ WebSocket Disconnected");

    return () => {
      if (
        ws.readyState === WebSocket.OPEN ||
        ws.readyState === WebSocket.CONNECTING
      ) {
        ws.close();
      }
    };
  }, [sessionId, isModelLoaded]);

  // 4. ฟังก์ชันส่งรูปผ่าน WebSocket
  const handleCheckIn = useCallback(() => {
    if (
      isProcessingRef.current ||
      !webcamRef.current ||
      !wsRef.current ||
      wsRef.current.readyState !== WebSocket.OPEN
    )
      return;

    isProcessingRef.current = true;
    setStatusLabel("Processing...");

    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        isProcessingRef.current = false;
        return;
      }

      wsRef.current.send(
        JSON.stringify({
          session_id: parseInt(sessionId),
          image: imageSrc,
        }),
      );
    } catch (err) {
      console.error("Check-in error:", err);
      setStatusLabel("Error - retrying...");
      setTimeout(() => {
        isProcessingRef.current = false;
        if (isSessionActiveRef.current) setStatusLabel("Scanning...");
      }, 2000);
    }
  }, [sessionId]);

  // 5. Loop สแกนใบหน้าด้วย Human
  useEffect(() => {
    if (!isModelLoaded || !humanRef.current) return;

    const interval = setInterval(async () => {
      if (
        !isSessionActiveRef.current ||
        !webcamRef.current?.video ||
        isProcessingRef.current
      )
        return;

      const video = webcamRef.current.video;
      if (video.readyState !== 4) return;

      const displaySize = {
        width: video.videoWidth,
        height: video.videoHeight,
      };
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = displaySize.width;
      canvas.height = displaySize.height;

      const result = await humanRef.current.detect(video);
      setFaceCount(result.face.length);

      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, displaySize.width, displaySize.height);

      result.face.forEach((face) => {
        const [x, y, width, height] = face.box;
        const boxColor = isProcessingRef.current ? "#f59e0b" : "#22c55e";
        const cornerLen = 16;

        ctx.strokeStyle = boxColor;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.4;
        ctx.strokeRect(x, y, width, height);
        ctx.globalAlpha = 1;

        ctx.lineWidth = 3;
        ctx.strokeStyle = boxColor;
        [
          [x, y + cornerLen, x, y, x + cornerLen, y],
          [x + width - cornerLen, y, x + width, y, x + width, y + cornerLen],
          [x, y + height - cornerLen, x, y + height, x + cornerLen, y + height],
          [
            x + width - cornerLen,
            y + height,
            x + width,
            y + height,
            x + width,
            y + height - cornerLen,
          ],
        ].forEach(([x1, y1, x2, y2, x3, y3]) => {
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.lineTo(x3, y3);
          ctx.stroke();
        });

        const label = isProcessingRef.current
          ? "Processing..."
          : "Face Detected";
        ctx.font = "bold 12px sans-serif";
        const labelW = ctx.measureText(label).width + 16;
        ctx.fillStyle = boxColor;
        ctx.beginPath();
        ctx.roundRect?.(x, y - 26, labelW, 22, 4) ||
          ctx.fillRect(x, y - 26, labelW, 22);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.fillText(label, x + 8, y - 10);
      });

      // ถ้าเจอใบหน้า ให้ส่งรูปผ่าน WebSocket
      if (result.face.length > 0 && !isProcessingRef.current) {
        handleCheckIn();
      }
    }, 800);

    return () => clearInterval(interval);
  }, [isModelLoaded, handleCheckIn]);

  const handleStopSession = async () => {
    setEndingSession(true);
    isSessionActiveRef.current = false;
    setIsSessionActive(false);
    setStatusLabel("Session Ended");

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    try {
      await api.post(`/sessions/${sessionId}/end`);
    } catch (e) {
      console.error("End session API error:", e);
    }

    localStorage.removeItem("active_session_id");
    window.dispatchEvent(new Event("storage"));

    setShowEndConfirm(false);
    setEndingSession(false);

    const wk = weekNumber || sessionInfo?.week_number;
    navigate("/teacher/dashboard", {
      state: {
        message: `Session${wk != null ? ` Week ${wk}` : ""} ended. Absent students marked automatically.`,
      },
    });
  };

  const videoConstraints = deviceId
    ? { deviceId: { exact: deviceId } }
    : { facingMode: "user" };
  const displaySessionId = sessionInfo?.id ?? sessionId;
  const displayCourseCode = courseCode || courseInfo?.course_code || "";
  const displayCourseName = courseName || courseInfo?.name || "";
  const displayWeek =
    weekNumber !== "" && weekNumber != null
      ? weekNumber
      : sessionInfo?.week_number;
  const displayRoom = room || sessionInfo?.room || "";

  return (
    <div className="flex h-screen bg-[#F3F4F6] font-sans overflow-hidden">
      <Sidebar />

      {/* End Session Confirmation Modal */}
      {showEndConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <FiAlertCircle size={24} className="text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-lg">
                  End Class Session?
                </h3>
                <p className="text-sm text-gray-500">
                  No more check-ins will be accepted
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6 bg-gray-50 p-3 rounded-xl">
              <span className="font-bold text-blue-600">
                {logs.length} student(s)
              </span>{" "}
              have checked in. Students who did not check in will be marked as{" "}
              <span className="font-bold text-rose-500">Absent</span>{" "}
              automatically.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEndConfirm(false)}
                disabled={endingSession}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition disabled:opacity-50"
              >
                Continue
              </button>
              <button
                onClick={handleStopSession}
                disabled={endingSession}
                className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition shadow-lg shadow-red-200 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {endingSession ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />{" "}
                    Ending...
                  </>
                ) : (
                  "End Session"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-slate-900 h-64 relative px-10 pt-10 pb-24">
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
                <FiCamera
                  className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm"
                  size={36}
                />
                Live Attendance
              </h1>
              <div className="text-blue-100 pl-1 mt-2 space-y-1.5 max-w-3xl">
                <p className="text-white text-lg font-bold tracking-tight">
                  {displayWeek != null && displayWeek !== ""
                    ? `Week ${displayWeek}`
                    : "Live Session"}
                </p>
                <p className="text-sm text-blue-100/95 flex flex-wrap items-center gap-x-2 gap-y-1">
                  {(displayCourseCode || displayCourseName) && (
                    <span className="font-semibold">
                      {displayCourseCode && (
                        <span className="text-white">{displayCourseCode}</span>
                      )}
                      {displayCourseCode && displayCourseName && (
                        <span className="text-blue-200/90"> — </span>
                      )}
                      {displayCourseName && <span>{displayCourseName}</span>}
                    </span>
                  )}
                  {(displayCourseCode || displayCourseName) && (
                    <span className="text-blue-300/80 hidden sm:inline">·</span>
                  )}
                  {displayRoom && (
                    <span className="text-sm">
                      <span className="text-blue-200/80">Room </span>
                      <span className="font-bold text-white">
                        {displayRoom}
                      </span>
                    </span>
                  )}
                </p>
                {!displayCourseCode &&
                  !displayCourseName &&
                  isFetchingAttendance && (
                    <p className="text-xs text-blue-200/70">Loading session…</p>
                  )}
              </div>
            </div>

            {isSessionActive ? (
              <button
                onClick={() => setShowEndConfirm(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg transition-all"
              >
                <FiStopCircle size={18} /> End Session
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <span className="px-4 py-2 bg-white/20 text-white font-bold rounded-xl text-sm">
                  Session Ended
                </span>
                <button
                  onClick={() => navigate("/teacher/dashboard")}
                  className="px-5 py-2.5 bg-white text-blue-700 font-bold rounded-xl shadow hover:bg-blue-50 transition-all text-sm"
                >
                  Back to Dashboard →
                </button>
              </div>
            )}
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
        </div>

        {/* Content */}
        <div
          className="px-10 -mt-20 pb-6 relative z-20"
          style={{ height: "calc(100vh - 80px)" }}
        >
          <div className="flex gap-5 h-full">
            {/* Camera Panel */}
            <div className="flex-1 bg-black rounded-3xl overflow-hidden relative shadow-xl border border-gray-800">
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                className="w-full h-full object-cover"
              />
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full"
              />

              {/* Status Bar */}
              <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
                <div className="flex items-center gap-2 bg-black/60 text-white px-4 py-1.5 rounded-full text-sm backdrop-blur-md">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${isSessionActive ? "bg-green-400 animate-pulse" : "bg-red-500"}`}
                  />
                  <span className="font-semibold">{statusLabel}</span>
                </div>
                {isSessionActive && (
                  <div className="flex items-center gap-2 bg-black/60 text-white px-4 py-1.5 rounded-full text-sm backdrop-blur-md">
                    <FiUsers size={14} />
                    <span className="font-semibold">
                      {faceCount} face{faceCount !== 1 ? "s" : ""} detected
                    </span>
                  </div>
                )}
              </div>

              {!isModelLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                  <div className="text-center text-white">
                    <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-3" />
                    <p className="font-bold">Loading face detection model...</p>
                  </div>
                </div>
              )}

              {!isSessionActive && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                  <div className="text-center text-white">
                    <FiStopCircle
                      size={48}
                      className="mx-auto mb-3 text-red-400"
                    />
                    <p className="text-xl font-bold">Session Ended</p>
                    <p className="text-sm text-white/60 mt-1">
                      {logs.length} student(s) recorded
                    </p>
                    <button
                      onClick={() => navigate("/teacher/dashboard")}
                      className="mt-4 px-6 py-2 bg-white text-blue-700 font-bold rounded-xl text-sm hover:bg-blue-50 transition"
                    >
                      Back to Dashboard →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Attendance Log Panel */}
            <div className="w-80 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <FiUsers size={16} className="text-blue-500" /> Checked In
                </h3>
                <div className="flex items-center gap-2">
                  {isFetchingAttendance && (
                    <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  )}
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                    {logs.length} students
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                {logs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 text-center pb-10">
                    <FiWifi size={32} className="mb-3 opacity-40" />
                    <p className="font-semibold text-sm">
                      Waiting for students...
                    </p>
                    <p className="text-xs mt-1 opacity-60">
                      Students should face the camera to check in
                    </p>
                  </div>
                ) : (
                  logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl"
                    >
                      <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {log.student_name?.charAt(0) || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-gray-800 truncate">
                          {log.student_name}
                        </p>
                        <p className="text-xs text-gray-400 font-mono">
                          {log.display_id}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span
                          className={`flex items-center text-xs gap-1 font-bold ${log.status === "late" ? "text-amber-500" : "text-green-500"}`}
                        >
                          <FiCheckCircle size={12} /> {log.time}
                        </span>
                        {log.status === "late" && (
                          <span className="text-xs text-amber-400 font-medium flex items-center gap-0.5 justify-end mt-0.5">
                            <FiClock size={10} /> Late
                          </span>
                        )}
                        {log.confidence && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            Acc : {Math.round(log.confidence * 100)}%
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {logs.length > 0 && (
                <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
                  <p className="text-xs text-gray-400 text-center font-medium">
                    Auto-saved · {new Date().toLocaleDateString("en-US")}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RealTimeAttendance;
