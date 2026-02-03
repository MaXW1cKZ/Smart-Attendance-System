import React, { useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import {
  FiCamera,
  FiCheckCircle,
  FiLoader,
  FiRefreshCw,
  FiUser,
  FiArrowLeft,
  FiArrowRight,
  FiSmile // เพิ่มไอคอน
} from "react-icons/fi";
import Sidebar from "../../components/Sidebar";

// กำหนดขั้นตอนการถ่ายรูป
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

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [capturedImages, setCapturedImages] = useState([]); 
  const imagesRef = useRef([]); 

  const [isCountDown, setIsCountDown] = useState(false);
  const [count, setCount] = useState(3);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Logic การถ่ายรูป (คงเดิม)
  const handleCaptureClick = () => {
    setIsCountDown(true);
    setCount(3);

    let timer = 3;
    const interval = setInterval(() => {
      timer--;
      setCount(timer);
      if (timer === 0) {
        clearInterval(interval);
        captureFrame();
        setIsCountDown(false);
      }
    }, 1000);
  };

  const captureFrame = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      setCapturedImages((prev) => [...prev, imageSrc]);
      fetch(imageSrc)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File(
            [blob],
            `face_${STEPS[currentStepIndex].id}.jpg`,
            { type: "image/jpeg" },
          );
          imagesRef.current.push(file);

          if (currentStepIndex < STEPS.length - 1) {
            setTimeout(() => {
              setCurrentStepIndex((prev) => prev + 1);
            }, 500);
          } else {
            uploadImages();
          }
        });
    }
  }, [webcamRef, currentStepIndex]);

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
      alert("Error uploading images. Please try again.");
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
    <div className="flex h-screen bg-[#F3F4F6] font-sans">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        {/* --- Header Section (Gradient Theme) --- */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-600 h-64 relative px-10 pt-10 pb-24">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
               <FiSmile className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm" size={36} />
               Face Registration
            </h1>
            <p className="text-blue-100 opacity-90 pl-1">
               Register your face ID for automated attendance checking.
            </p>
          </div>
          
          {/* Decorative Circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-20 w-32 h-32 bg-blue-500/30 rounded-full blur-2xl pointer-events-none"></div>
        </div>

        {/* --- Floating Content Container --- */}
        <div className="px-10 -mt-20 pb-10 relative z-20">
          <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 p-8 md:p-10 flex flex-col md:flex-row gap-10 min-h-[600px]">
            
            {/* --- Left: Camera View --- */}
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 rounded-2xl border border-gray-200 p-4 relative overflow-hidden">
               {/* Decorative Line Top */}
               <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-400"></div>

               <div className="relative w-full max-w-lg aspect-[4/3] bg-black rounded-xl overflow-hidden shadow-md ring-4 ring-white">
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
                      {/* Overlay Guide */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className={`w-56 h-72 border-2 border-dashed rounded-[50%] transition-all duration-300 ${isCountDown ? "border-rose-500 scale-105" : "border-white/50"}`}></div>
                      </div>
                      
                      {/* Countdown */}
                      {isCountDown && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-20">
                          <span className="text-8xl font-bold text-white animate-bounce drop-shadow-lg">
                            {count}
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="absolute inset-0 bg-emerald-50 flex flex-col items-center justify-center text-emerald-600">
                      <div className="p-4 bg-emerald-100 rounded-full mb-4">
                         <FiCheckCircle className="text-6xl" />
                      </div>
                      <h2 className="text-2xl font-bold">Registration Complete!</h2>
                      <p className="text-emerald-500 mt-2">Your face data has been saved.</p>
                    </div>
                  )}
               </div>

               {/* Instruction Text Below Camera */}
               {!isSuccess && (
                 <div className="mt-6 text-center">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center justify-center gap-2">
                       {currentStep.icon} {currentStep.label}
                    </h3>
                    <p className="text-gray-500 mt-1 text-sm">{currentStep.instruction}</p>
                 </div>
               )}
            </div>

            {/* --- Right: Steps & Controls --- */}
            <div className="w-full md:w-80 flex flex-col justify-between">
                
                {/* Steps List */}
                <div>
                   <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">
                      Progress Steps
                   </h3>
                   <div className="space-y-3">
                      {STEPS.map((step, index) => (
                        <div
                          key={step.id}
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                            index === currentStepIndex
                              ? "bg-blue-50 border-blue-200 text-blue-700 shadow-sm ring-1 ring-blue-100"
                              : index < currentStepIndex
                                ? "bg-emerald-50 border-emerald-100 text-emerald-600"
                                : "bg-gray-50 border-gray-100 text-gray-400 opacity-60"
                          }`}
                        >
                          {/* Step Number / Check Icon */}
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                             index === currentStepIndex ? "bg-blue-600 text-white" :
                             index < currentStepIndex ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-500"
                          }`}>
                             {index < currentStepIndex ? <FiCheckCircle /> : index + 1}
                          </div>

                          <div className="flex-1 min-w-0">
                             <p className="font-semibold text-sm truncate">{step.label}</p>
                             <p className="text-xs opacity-80 truncate">{index === currentStepIndex ? "In Progress..." : index < currentStepIndex ? "Completed" : "Waiting"}</p>
                          </div>
                          
                          {/* Thumbnail Preview */}
                          {capturedImages[index] && (
                             <img src={capturedImages[index]} className="w-10 h-10 rounded-md object-cover border border-gray-200 shadow-sm" alt="captured" />
                          )}
                        </div>
                      ))}
                   </div>
                </div>

                {/* Control Buttons */}
                <div className="mt-8 pt-6 border-t border-gray-100">
                   {!isSuccess ? (
                      <button
                        onClick={handleCaptureClick}
                        disabled={isCountDown || isUploading}
                        className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transform transition-all hover:-translate-y-1 flex items-center justify-center gap-2
                           ${isCountDown 
                             ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none" 
                             : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-blue-200 hover:from-blue-700 hover:to-indigo-700"
                           }`}
                      >
                        {isUploading ? (
                          <><FiLoader className="animate-spin" /> Processing...</>
                        ) : isCountDown ? (
                          "Get Ready..."
                        ) : (
                          <><FiCamera /> Capture Photo</>
                        )}
                      </button>
                   ) : (
                      <button
                        onClick={resetProcess}
                        className="w-full py-4 bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                      >
                        <FiRefreshCw /> Register Again
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