import React, { useState, useRef, useEffect, useCallback } from "react";
import Webcam from "react-webcam";
import api from "../../api/axios";
import * as faceapi from "face-api.js"; // Import face-api
import {
  FiCamera,
  FiLoader,
  FiRefreshCw,
  FiUser,
  FiArrowLeft,
  FiArrowRight,
} from "react-icons/fi";
import Sidebar from "../../components/Sidebar";

const STEPS = [
  {
    id: "straight",
    label: "Straight Face",
    instruction: "Look straight at the camera.",
    icon: <FiUser size={24} />,
  },
  {
    id: "left",
    label: "Turn Left",
    instruction: "Turn your face slightly to the left.",
    icon: <FiArrowLeft size={24} />,
  },
  {
    id: "right",
    label: "Turn Right",
    instruction: "Turn your face slightly to the right.",
    icon: <FiArrowRight size={24} />,
  },
];

const FaceRegister = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [capturedImages, setCapturedImages] = useState([]);
  const imagesRef = useRef([]);

  const [isCountDown, setIsCountDown] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = "/models";
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        setIsModelLoaded(true);
        console.log("FaceAPI Models Loaded");
      } catch (err) {
        console.error("Failed to load models:", err);
      }
    };
    loadModels();
  }, []);

  useEffect(() => {
    let interval;
    const runDetection = async () => {
      if (!isModelLoaded || !webcamRef.current || !webcamRef.current.video)
        return;

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

        const resizedDetections = faceapi.resizeResults(
          detections,
          displaySize,
        );
        const ctx = canvasRef.current.getContext("2d");
        ctx.clearRect(0, 0, displaySize.width, displaySize.height);

        if (resizedDetections.length > 0) {
          const face = resizedDetections[0];

          const { width, height, x, y } = face.box;
          const score = face.score;

          const isClear = score > 0.7;
          const isLargeEnough = width > 100 && height > 100;

          const videoCenter = displaySize.width / 2;
          const faceCenter = x + width / 2;
          const isCentered = Math.abs(videoCenter - faceCenter) < 150;

          if (isClear && isLargeEnough && isCentered) {
            setFaceDetected(true);
            const drawBox = new faceapi.draw.DrawBox(face.box, {
              boxColor: "green",
              label: "Perfect!",
            });
            drawBox.draw(canvasRef.current);
          } else {
            setFaceDetected(false);
            let msg = "Move Closer";
            if (!isCentered) msg = "Center your face";
            if (!isClear) msg = "Not clear";

            const drawBox = new faceapi.draw.DrawBox(face.box, {
              boxColor: "red",
              label: msg,
            });
            drawBox.draw(canvasRef.current);
          }
        } else {
          setFaceDetected(false);
        }
      } catch (error) {
        console.error("Detection Error:", error);
      }
    };

    if (isModelLoaded) {
      interval = setInterval(runDetection, 500);
    }

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
          setCapturedImages((prev) => [...prev, imageSrc]);
          imagesRef.current.push(imageSrc);
          setIsCountDown(false);

          if (currentStepIndex < STEPS.length - 1) {
            setTimeout(() => setCurrentStepIndex((prev) => prev + 1), 500);
          } else {
            uploadImages(imageSrc);
          }
        }
      }
    }, 1000);
  }, [webcamRef, currentStepIndex, faceDetected]);

  const uploadImages = async (lastImage) => {
    setIsUploading(true);
    try {
      const bestImage = imagesRef.current[0] || lastImage;

      await api.post("/student/register-face", { image: bestImage });


      setIsSuccess(true);
      alert("ลงทะเบียนใบหน้าสำเร็จ!");
    } catch (error) {
      console.error(error);
      alert("Registration Failed: " + (error.response?.data?.detail || ""));
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

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role="student" />
      <main className="flex-1 p-8 flex flex-col items-center justify-center">
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-4xl flex gap-8">
          <div className="flex-1">
            <div className="relative aspect-[4/3] bg-black rounded-2xl overflow-hidden border-4 border-gray-100 shadow-inner">
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
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white z-10">
                  <FiLoader className="animate-spin text-4xl mb-2" />{" "}
                  <span>Loading AI...</span>
                </div>
              )}
            </div>
          </div>

          <div className="w-80 flex flex-col justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-6">Face Registration</h2>
              <div className="space-y-4">
                {STEPS.map((step, idx) => (
                  <div
                    key={step.id}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                      idx === currentStepIndex
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-100 opacity-50"
                    }`}
                  >
                    <div
                      className={`p-3 rounded-full ${idx === currentStepIndex ? "bg-blue-500 text-white" : "bg-gray-200"}`}
                    >
                      {step.icon}
                    </div>
                    <div>
                      <p className="font-bold">{step.label}</p>
                      <p className="text-xs text-gray-500">
                        {step.instruction}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={captureFrame}
              disabled={
                !faceDetected || isCountDown || isUploading || isSuccess
              }
              className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all
                ${!faceDetected && !isSuccess ? "bg-gray-300 cursor-not-allowed text-gray-500" : "bg-blue-600 text-white hover:bg-blue-700"}
              `}
            >
              {isUploading
                ? "Processing..."
                : isSuccess
                  ? "Registered!"
                  : !faceDetected
                    ? "No Face Detected"
                    : isCountDown
                      ? "Hold Still..."
                      : "Capture Photo"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FaceRegister;
