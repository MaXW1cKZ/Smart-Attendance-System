import React, { useState, useRef, useEffect, useCallback } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import * as faceapi from "face-api.js";
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
    icon: <FiUser size={20} />,
  },
  {
    id: "left",
    label: "Turn Left",
    instruction: "Turn your face slightly to the left.",
    icon: <FiArrowLeft size={20} />,
  },
  {
    id: "right",
    label: "Turn Right",
    instruction: "Turn your face slightly to the right.",
    icon: <FiArrowRight size={20} />,
  },
];

const FaceRegister = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const imagesRef = useRef([]);

  const [isCountDown, setIsCountDown] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  /* load face-api models */
  useEffect(() => {
    faceapi.nets.tinyFaceDetector
      .loadFromUri("/models")
      .then(() => setIsModelLoaded(true))
      .catch((err) => console.error("Failed to load models:", err));
  }, []);

  /* face detection loop */
  useEffect(() => {
    if (!isModelLoaded) return;
    const interval = setInterval(async () => {
      if (!webcamRef.current?.video) return;
      const video = webcamRef.current.video;
      if (video.readyState !== 4) return;

      const displaySize = {
        width: video.videoWidth,
        height: video.videoHeight,
      };
      faceapi.matchDimensions(canvasRef.current, displaySize);

      try {
        const detections = await faceapi.detectAllFaces(
          video,
          new faceapi.TinyFaceDetectorOptions(),
        );
        const resized = faceapi.resizeResults(detections, displaySize);
        const ctx = canvasRef.current.getContext("2d");
        ctx.clearRect(0, 0, displaySize.width, displaySize.height);

        if (resized.length > 0) {
          const face = resized[0];
          const { width, height, x } = face.box;
          const score = face.score;
          const isClear = score > 0.7;
          const isLarge = width > 100 && height > 100;
          const isCentered =
            Math.abs(displaySize.width / 2 - (x + width / 2)) < 150;

          if (isClear && isLarge && isCentered) {
            setFaceDetected(true);
            new faceapi.draw.DrawBox(face.box, {
              boxColor: "green",
              label: "Perfect!",
            }).draw(canvasRef.current);
          } else {
            setFaceDetected(false);
            const msg = !isCentered
              ? "Center your face"
              : !isLarge
                ? "Move closer"
                : "Not clear";
            new faceapi.draw.DrawBox(face.box, {
              boxColor: "red",
              label: msg,
            }).draw(canvasRef.current);
          }
        } else {
          setFaceDetected(false);
        }
      } catch {}
    }, 500);
    return () => clearInterval(interval);
  }, [isModelLoaded]);

  const captureFrame = useCallback(() => {
    if (!faceDetected) return;
    setIsCountDown(true);
    let counter = 3;
    const interval = setInterval(() => {
      counter--;
      if (counter === 0) {
        clearInterval(interval);
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
          imagesRef.current.push(imageSrc);
          setIsCountDown(false);
          if (currentStepIndex < STEPS.length - 1) {
            setTimeout(() => setCurrentStepIndex((p) => p + 1), 500);
          } else {
            uploadImages();
          }
        }
      }
    }, 1000);
  }, [currentStepIndex, faceDetected]);

  const uploadImages = async () => {
    setIsUploading(true);
    setErrorMsg("");
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:8000/student/register-face",
        { image: imagesRef.current[0] },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setIsSuccess(true);
    } catch (error) {
      setErrorMsg(
        "Registration failed: " +
          (error.response?.data?.detail || "Please try again."),
      );
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
  };

  return (
    <div className="flex h-screen bg-[#F3F4F6] font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-700 to-slate-900 h-64 relative px-10 pt-10 pb-24">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <FiCamera className="bg-white/10 p-1.5 rounded-lg" size={36} />
              Face Registration
            </h1>
            <p className="text-slate-300 opacity-90 pl-1">
              Register your face so the system can check you in automatically
            </p>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
        </div>

        <div className="px-10 -mt-20 pb-10 relative z-20">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            {errorMsg && (
              <div className="flex items-center gap-2 text-rose-600 bg-rose-50 border border-rose-200 px-4 py-3 rounded-xl mb-6">
                <FiAlertCircle size={16} />
                <span className="text-sm font-semibold">{errorMsg}</span>
              </div>
            )}
            {isSuccess && (
              <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-200 px-4 py-3 rounded-xl mb-6">
                <FiCheckCircle size={16} />
                <span className="text-sm font-semibold">
                  Face registered successfully!
                </span>
              </div>
            )}

            <div className="flex gap-8 flex-col lg:flex-row">
              <div className="flex-1">
                <div className="relative aspect-[4/3] bg-black rounded-2xl overflow-hidden border border-gray-200 shadow-inner">
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    className="w-full h-full object-cover"
                  />
                  <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 w-full h-full"
                  />

                  {!isModelLoaded && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white z-10 gap-3">
                      <FiRefreshCw className="animate-spin" size={32} />
                      <span className="text-sm font-semibold">
                        Loading AI model…
                      </span>
                    </div>
                  )}

                  {isModelLoaded && (
                    <div
                      className={`absolute bottom-3 left-3 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                        faceDetected
                          ? "bg-emerald-500/90 text-white"
                          : "bg-rose-500/90 text-white"
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${faceDetected ? "bg-white animate-pulse" : "bg-white/60"}`}
                      />
                      {faceDetected ? "Face detected" : "No face detected"}
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full lg:w-80 flex flex-col gap-5">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                    Steps
                  </p>
                  <div className="space-y-3">
                    {STEPS.map((step, idx) => {
                      const done = idx < currentStepIndex || isSuccess;
                      const active = idx === currentStepIndex && !isSuccess;
                      return (
                        <div
                          key={step.id}
                          className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                            done
                              ? "border-emerald-200 bg-emerald-50"
                              : active
                                ? "border-slate-300 bg-slate-50"
                                : "border-gray-100 bg-gray-50 opacity-50"
                          }`}
                        >
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                              done
                                ? "bg-emerald-500 text-white"
                                : active
                                  ? "bg-slate-700 text-white"
                                  : "bg-gray-200 text-gray-400"
                            }`}
                          >
                            {done ? <FiCheckCircle size={16} /> : step.icon}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-gray-800">
                              {step.label}
                            </p>
                            <p className="text-xs text-gray-500">
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
                      className="h-full bg-slate-700 rounded-full transition-all duration-500"
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
                    className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all shadow-lg ${
                      faceDetected && !isCountDown && !isUploading
                        ? "bg-slate-800 hover:bg-slate-700 text-white shadow-slate-200 hover:-translate-y-0.5"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {isUploading ? (
                      <>
                        <FiRefreshCw className="animate-spin" size={16} />{" "}
                        Processing…
                      </>
                    ) : isCountDown ? (
                      "Hold Still…"
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
                    className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-600 transition"
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
