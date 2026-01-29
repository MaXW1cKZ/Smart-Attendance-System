import React, { useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import {
  FiCamera,
  FiCheckCircle,
  FiLoader,
  FiRefreshCw,
  FiChevronRight,
  FiUser,
  FiArrowLeft,
  FiArrowRight,
} from "react-icons/fi";

// Import Sidebar
import Sidebar from "../../components/Sidebar";

// กำหนดขั้นตอนการถ่ายรูป (Config steps)
const STEPS = [
  {
    id: "straight",
    label: "หน้าตรง (Straight)",
    instruction: "มองกล้องตรงๆ ให้เห็นใบหน้าชัดเจน",
    icon: <FiUser className="text-3xl" />,
  },
  {
    id: "left",
    label: "หันซ้าย (Turn Left)",
    instruction: "หันหน้าไปทางซ้ายเล็กน้อย (ประมาณ 30-45 องศา)",
    icon: <FiArrowLeft className="text-3xl" />,
  },
  {
    id: "right",
    label: "หันขวา (Turn Right)",
    instruction: "หันหน้าไปทางขวาเล็กน้อย (ประมาณ 30-45 องศา)",
    icon: <FiArrowRight className="text-3xl" />,
  },
];

const FaceRegister = () => {
  const webcamRef = useRef(null);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [capturedImages, setCapturedImages] = useState([]); // เก็บ URL รูปที่ถ่าย
  const imagesRef = useRef([]); // เก็บ File Object เพื่อส่งหลังบ้าน

  const [isCountDown, setIsCountDown] = useState(false);
  const [count, setCount] = useState(3);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // ฟังก์ชันเริ่มนับถอยหลังถ่ายรูป
  const handleCaptureClick = () => {
    setIsCountDown(true);
    setCount(3);

    let timer = 3;
    const interval = setInterval(() => {
      timer--;
      setCount(timer);
      if (timer === 0) {
        clearInterval(interval);
        captureFrame(); // ถ่ายรูปจริง
        setIsCountDown(false);
      }
    }, 1000);
  };

  // ฟังก์ชันจับภาพ
  const captureFrame = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      // 1. เก็บรูปโชว์
      setCapturedImages((prev) => [...prev, imageSrc]);

      // 2. แปลงเป็นไฟล์รอส่ง
      fetch(imageSrc)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File(
            [blob],
            `face_${STEPS[currentStepIndex].id}.jpg`,
            { type: "image/jpeg" },
          );
          imagesRef.current.push(file);

          // 3. ไปขั้นตอนถัดไป
          if (currentStepIndex < STEPS.length - 1) {
            setTimeout(() => {
              setCurrentStepIndex((prev) => prev + 1);
            }, 500); // ดีเลย์นิดนึงให้ user รู้ตัว
          } else {
            // ครบทุกขั้นตอนแล้ว
            uploadImages();
          }
        });
    }
  }, [webcamRef, currentStepIndex]);

  // ฟังก์ชันส่งรูปไป Backend
  const uploadImages = async () => {
    setIsUploading(true);
    const formData = new FormData();
    imagesRef.current.forEach((file) => {
      formData.append("files", file);
    });

    try {
      const token = localStorage.getItem("token");
      await axios.post("http://localhost:8000/faces/register", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      setIsSuccess(true);
    } catch (error) {
      console.error("Upload failed", error);
      alert("เกิดข้อผิดพลาดในการอัปโหลด กรุณาลองใหม่");
      resetProcess();
    } finally {
      setIsUploading(false);
    }
  };

  const resetProcess = () => {
    setCapturedImages([]);
    imagesRef.current = [];
    setCurrentStepIndex(0);
    setIsSuccess(false);
    setIsUploading(false);
  };

  const currentStep = STEPS[currentStepIndex];

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <Sidebar />

      <main className="flex-1 p-6 md:p-10 flex flex-col items-center justify-center overflow-y-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">ลงทะเบียนใบหน้า</h1>
          <p className="text-gray-500 mt-2">
            กรุณาทำตามขั้นตอนเพื่อความแม่นยำในการเช็คชื่อ
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 w-full max-w-5xl flex flex-col md:flex-row gap-10">
          {/* --- Left: Camera Section --- */}
          <div className="flex-1 flex flex-col items-center">
            <div className="relative w-full aspect-[4/3] bg-gray-900 rounded-2xl overflow-hidden shadow-inner border-4 border-white ring-4 ring-gray-100">
              {!isSuccess ? (
                <>
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{ facingMode: "user" }}
                    className="w-full h-full object-cover mirror-mode"
                    mirrored={true}
                  />

                  {/* Overlay Guide (วงกลมหน้า) */}
                  <div className="absolute inset-0 border-2 border-dashed border-white/30 rounded-2xl flex items-center justify-center pointer-events-none">
                    <div
                      className={`w-64 h-80 border-4 rounded-[50%] transition-colors duration-300 ${isCountDown ? "border-red-500 scale-105" : "border-blue-400/70"}`}
                    ></div>
                  </div>

                  {/* Countdown Number */}
                  {isCountDown && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-20">
                      <span className="text-9xl font-bold text-white animate-bounce drop-shadow-lg">
                        {count}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="absolute inset-0 bg-green-50 flex flex-col items-center justify-center text-green-600">
                  <FiCheckCircle className="text-8xl mb-4" />
                  <h2 className="text-2xl font-bold">ลงทะเบียนสำเร็จ!</h2>
                  <p>ข้อมูลใบหน้าของคุณถูกบันทึกเรียบร้อยแล้ว</p>
                </div>
              )}
            </div>

            {/* Status Text under Camera */}
            {!isSuccess && (
              <div className="mt-6 text-center">
                <div className="text-blue-600 font-bold text-xl flex items-center justify-center gap-2">
                  {currentStep.icon} {currentStep.label}
                </div>
                <p className="text-gray-500">{currentStep.instruction}</p>
              </div>
            )}
          </div>

          {/* --- Right: Controls & Progress --- */}
          <div className="w-full md:w-80 flex flex-col gap-6">
            {/* Step Indicators */}
            <div className="space-y-3">
              <h3 className="font-bold text-gray-700 mb-2">ขั้นตอน (Steps)</h3>
              {STEPS.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    index === currentStepIndex
                      ? "bg-blue-50 border-blue-200 text-blue-700 shadow-sm"
                      : index < currentStepIndex
                        ? "bg-green-50 border-green-200 text-green-700"
                        : "bg-gray-50 border-gray-100 text-gray-400"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === currentStepIndex
                        ? "bg-blue-600 text-white"
                        : index < currentStepIndex
                          ? "bg-green-500 text-white"
                          : "bg-gray-200"
                    }`}
                  >
                    {index < currentStepIndex ? <FiCheckCircle /> : index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{step.label}</p>
                  </div>
                  {/* Show captured thumbnail */}
                  {capturedImages[index] && (
                    <img
                      src={capturedImages[index]}
                      className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                      alt="mini"
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="mt-auto">
              {/* ปุ่มกดถ่าย */}
              {!isSuccess ? (
                <button
                  onClick={handleCaptureClick}
                  disabled={isCountDown || isUploading}
                  className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transform transition-all hover:-translate-y-1 flex items-center justify-center gap-2
                                ${
                                  isCountDown
                                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-blue-200"
                                }`}
                >
                  {isUploading ? (
                    <>
                      <FiLoader className="animate-spin" /> กำลังบันทึก...
                    </>
                  ) : isCountDown ? (
                    "เตรียมตัว..."
                  ) : (
                    <>
                      <FiCamera /> ถ่ายภาพ ({currentStepIndex + 1}/
                      {STEPS.length})
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={resetProcess}
                  className="w-full py-4 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <FiRefreshCw /> ลงทะเบียนใหม่
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FaceRegister;
