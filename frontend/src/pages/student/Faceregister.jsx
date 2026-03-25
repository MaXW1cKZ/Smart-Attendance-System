import React, { useState, useRef, useEffect, useCallback } from "react";
import Webcam from "react-webcam";
import api from "../../api/axios";
import Human from "@vladmandic/human";
import {
  FiCamera,
  FiRefreshCw,
  FiUser,
  FiArrowLeft,
  FiArrowRight,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";
import Sidebar from "../../components/Sidebar";

const STEPS = [
  {
    id: "straight",
    label: "Straight Face",
    instruction: "Look straight at the camera.",
    icon: <FiUser size={18} />,
  },
  {
    id: "left",
    label: "Turn Left",
    instruction: "Turn your face slightly to the left.",
    icon: <FiArrowLeft size={18} />,
  },
  {
    id: "right",
    label: "Turn Right",
    instruction: "Turn your face slightly to the right.",
    icon: <FiArrowRight size={18} />,
  },
];

const FaceRegister = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const humanRef = useRef(null);

  // ใช้ useRef สำหรับควบคุมสถานะ
  const isDetectingRef = useRef(true);
  const isCountDownRef = useRef(false);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const imagesRef = useRef([]);
  const [isCountDown, setIsCountDown] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // 1. โหลด Model Human (Config เดียวกับฝั่งอาจารย์)
  useEffect(() => {
    const loadHumanModel = async () => {
      try {
        const human = new Human({
          modelBasePath: "https://vladmandic.github.io/human-models/models",
          face: {
            enabled: true,
            detector: { rotation: true, maxDetected: 1 },
            mesh: { enabled: false },
            iris: { enabled: false },
            description: { enabled: false },
            emotion: { enabled: false },
            liveness: { enabled: false }, // ปิดไปก่อนเพื่อความลื่นไหล เหมือนฝั่งอาจารย์
          },
          body: { enabled: false },
          hand: { enabled: false },
          object: { enabled: false },
          gesture: { enabled: false },
        });

        await human.load();
        humanRef.current = human;
        setIsModelLoaded(true);
      } catch (error) {
        console.error("Failed to load models:", error);
      }
    };
    loadHumanModel();
  }, []);

  // 2. Loop สแกนใบหน้า (ใช้ setInterval เหมือนฝั่งอาจารย์)
  useEffect(() => {
    if (!isModelLoaded || !humanRef.current) return;

    const interval = setInterval(async () => {
      if (!isDetectingRef.current || !webcamRef.current?.video) return;

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
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, displaySize.width, displaySize.height);

      if (result.face && result.face.length > 0) {
        const face = result.face[0];

        // --- 🚨 กลับด้านแกน X สำหรับ Canvas แบบ Mirror ---
        const [xOriginal, y, width, height] = face.box;
        const x = displaySize.width - xOriginal - width;

        // เช็คเงื่อนไข
        const isClear = face.boxScore > 0.5;
        const isLarge = width > 100 && height > 100;
        const isCentered =
          Math.abs(displaySize.width / 2 - (x + width / 2)) < 200;

        const isGood = isClear && isLarge && isCentered;
        setFaceDetected(isGood);

        // --- วาดกรอบหน้า (สไตล์เดียวกับฝั่งอาจารย์) ---
        const boxColor = isGood ? "#22c55e" : "#ef4444"; // เขียว ถ้าผ่านเกณฑ์, แดง ถ้าไม่ผ่าน
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

        // --- วาด Label ข้อความ ---
        const label = isGood ? "Perfect!" : "Center Face / Move Closer";
        ctx.font = "bold 12px sans-serif";
        const labelW = ctx.measureText(label).width + 16;
        ctx.fillStyle = boxColor;
        ctx.beginPath();
        ctx.roundRect?.(x, y - 26, labelW, 22, 4) ||
          ctx.fillRect(x, y - 26, labelW, 22);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.fillText(label, x + 8, y - 10);
      } else {
        setFaceDetected(false);
      }
    }, 800); // 💡 ใช้ความเร็ว 800ms เท่าฝั่งอาจารย์ จะได้ไม่กระพริบมาก

    return () => clearInterval(interval);
  }, [isModelLoaded]);

  // 3. ฟังก์ชันถ่ายรูป
  const captureFrame = useCallback(() => {
    if (!faceDetected || isCountDownRef.current) return;

    setIsCountDown(true);
    isCountDownRef.current = true;

    let counter = 3;
    const interval = setInterval(() => {
      counter--;
      if (counter === 0) {
        clearInterval(interval);
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
          imagesRef.current.push(imageSrc);
          setIsCountDown(false);
          isCountDownRef.current = false;

          if (currentStepIndex < STEPS.length - 1) {
            setTimeout(() => setCurrentStepIndex((p) => p + 1), 500);
          } else {
            uploadImages();
          }
        }
      }
    }, 1000);
  }, [currentStepIndex, faceDetected]);

  // 4. อัพโหลดรูปภาพ
  const uploadImages = async () => {
    setIsUploading(true);
    isDetectingRef.current = false; // หยุดสแกนชั่วคราวตอนอัพโหลด
    setErrorMsg("");
    try {
      const token = localStorage.getItem("token");
      await api.post(
        "/student/register-face",
        { images: imagesRef.current },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setIsSuccess(true);
      // เคลียร์ Canvas หลังอัพโหลดเสร็จ
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d");
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    } catch (error) {
      setErrorMsg(
        "Registration failed: " +
          (error.response?.data?.detail || "Please try again."),
      );
      isDetectingRef.current = true; // กลับมาสแกนใหม่ถ้าพลาด
    } finally {
      setIsUploading(false);
    }
  };

  const resetProcess = () => {
    imagesRef.current = [];
    setCurrentStepIndex(0);
    setIsSuccess(false);
    setIsUploading(false);
    setErrorMsg("");
    isDetectingRef.current = true; // เปิดการสแกนกลับมา
  };

  return (
    <div className="flex h-screen bg-[#F3F4F6] font-sans overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-slate-900 h-52 sm:h-64 relative px-4 sm:px-8 md:px-10 pt-14 sm:pt-10 pb-20 sm:pb-24">
          <div className="relative z-10">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <FiCamera
                className="bg-white/10 p-1.5 rounded-lg hidden sm:block"
                size={36}
              />
              Face Registration
            </h1>
            <p className="text-blue-100 opacity-90 pl-1 text-sm">
              Register your face so the system can check you in automatically
            </p>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
        </div>

        <div className="px-4 sm:px-8 md:px-10 -mt-16 sm:-mt-20 pb-8 sm:pb-10 relative z-20">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 p-5 sm:p-8">
            {errorMsg && (
              <div className="flex items-center gap-2 text-rose-600 bg-rose-50 border border-rose-200 px-4 py-3 rounded-xl mb-5 sm:mb-6">
                <FiAlertCircle size={16} />
                <span className="text-sm font-semibold">{errorMsg}</span>
              </div>
            )}
            {isSuccess && (
              <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-200 px-4 py-3 rounded-xl mb-5 sm:mb-6">
                <FiCheckCircle size={16} />
                <span className="text-sm font-semibold">
                  Face registered successfully!
                </span>
              </div>
            )}

            <div className="flex flex-col lg:flex-row gap-5 sm:gap-8">
              {/* 🚨 Camera Area (เปลี่ยน Layout ให้เหมือนฝั่งอาจารย์) */}
              <div className="flex-1">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Camera
                </p>
                {/* ใช้โครงสร้างคล้ายๆ ของอาจารย์ คือ relative wrapper */}
                <div className="relative aspect-[4/3] bg-black rounded-3xl overflow-hidden shadow-xl border border-gray-800">
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    mirrored={true}
                    className="w-full h-full object-cover"
                  />
                  <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 w-full h-full"
                  />

                  {!isModelLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                      <div className="text-center text-white">
                        <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-3" />
                        <p className="font-bold">Loading AI model...</p>
                      </div>
                    </div>
                  )}

                  {isModelLoaded && !isSuccess && (
                    <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 text-white px-4 py-1.5 rounded-full text-sm backdrop-blur-md">
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${faceDetected ? "bg-green-400 animate-pulse" : "bg-red-500"}`}
                      />
                      <span className="font-semibold">
                        {faceDetected ? "Face Ready" : "Position Face"}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Steps & Controls */}
              <div className="w-full lg:w-80 flex flex-col gap-4 sm:gap-5">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                    Steps
                  </p>
                  <div className="flex flex-row lg:flex-col gap-2 sm:gap-3">
                    {STEPS.map((step, idx) => {
                      const done = idx < currentStepIndex || isSuccess;
                      const active = idx === currentStepIndex && !isSuccess;
                      return (
                        <div
                          key={step.id}
                          className={`flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-2xl border transition-all flex-1 lg:flex-none ${
                            done
                              ? "border-emerald-200 bg-emerald-50"
                              : active
                                ? "border-blue-300 bg-blue-50"
                                : "border-gray-100 bg-gray-50 opacity-50"
                          }`}
                        >
                          <div
                            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 ${
                              done
                                ? "bg-emerald-500 text-white"
                                : active
                                  ? "bg-blue-600 text-white"
                                  : "bg-gray-200 text-gray-400"
                            }`}
                          >
                            {done ? <FiCheckCircle size={15} /> : step.icon}
                          </div>
                          <div className="text-center sm:text-left">
                            <p className="font-bold text-xs sm:text-sm text-gray-800">
                              {step.label}
                            </p>
                            <p className="text-[10px] sm:text-xs text-gray-500 hidden sm:block">
                              {step.instruction}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-gray-400 mb-1.5">
                    <span>Progress</span>
                    <span>{isSuccess ? 3 : currentStepIndex} / 3 steps</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-500"
                      style={{
                        width: `${isSuccess ? 100 : (currentStepIndex / 3) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {!isSuccess ? (
                  <button
                    onClick={captureFrame}
                    disabled={!faceDetected || isCountDown || isUploading}
                    className={`w-full py-3.5 sm:py-4 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-lg ${
                      faceDetected && !isCountDown && !isUploading
                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 hover:-translate-y-0.5"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {isUploading ? (
                      <>
                        <FiRefreshCw className="animate-spin" size={16} />{" "}
                        Processing...
                      </>
                    ) : isCountDown ? (
                      "Hold Still..."
                    ) : !faceDetected ? (
                      "No Face Detected"
                    ) : (
                      <>
                        <FiCamera size={16} /> Capture Photo
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={resetProcess}
                    className="w-full py-3.5 sm:py-4 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-600 transition"
                  >
                    <FiRefreshCw size={16} /> Register Again
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FaceRegister;
