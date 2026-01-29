import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";

const Login = () => {
  const navigate = useNavigate();

  // State สำหรับ Login แบบปกติ
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // ⭐ ตรวจสอบว่า Login อยู่แล้วหรือไม่
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // ถ้า Login แล้ว -> ไปหน้า Dashboard เลย
      navigate("/dashboard");
    }
  }, [navigate]);

  // --- ฟังก์ชันส่วนกลาง: จัดการหลัง Login สำเร็จ (ใช้ร่วมกันทั้ง 2 แบบ) ---
  const handleLoginSuccessData = (data) => {
    const { access_token, token_type, role, user_name, user_id } = data;

    // 1. เก็บข้อมูลลง LocalStorage
    localStorage.setItem("token", access_token);
    localStorage.setItem("role", role || "student");
    localStorage.setItem("user_name", user_name || "User");
    localStorage.setItem("user_id", user_id || "");

    // 2. แยกเส้นทางตาม Role 🚦
    if (role === "admin") {
      navigate("/dashboard");
    } else if (role === "teacher") {
      navigate("/teacher/dashboard");
    } else {
      // Student (Default)
      navigate("/student/dashboard");
    }
  };

  // --- 1️⃣ Logic: Standard Login ---
  const handleStandardLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      // ส่งข้อมูลแบบ Form Data (ตามมาตรฐาน OAuth2)
      const formData = new FormData();
      formData.append("username", email);
      formData.append("password", password);

      const res = await axios.post("http://localhost:8000/token", formData);
      handleLoginSuccessData(res.data);
    } catch (err) {
      console.error(err);
      setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    }
  };

  // --- 2️⃣ Logic: Google Login ---
  const handleGoogleSuccess = async (credentialResponse) => {
    setError("");
    try {
      const res = await axios.post("http://localhost:8000/google-login", {
        token: credentialResponse.credential,
      });
      handleLoginSuccessData(res.data);
    } catch (err) {
      console.error("Google Login Failed:", err);
      setError("เข้าสู่ระบบด้วย Google ไม่สำเร็จ");
    }
  };

  // --- UI ---
  return (
    <div className="flex h-screen w-full bg-white font-sans overflow-hidden">
      {/* Left Side - Image */}
      <div className="hidden lg:flex w-1/2 bg-blue-50 items-center justify-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] bg-blue-200/50 rounded-full blur-3xl mix-blend-multiply animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-purple-200/50 rounded-full blur-3xl mix-blend-multiply animate-blob animation-delay-2000"></div>
        <img
          src="https://img.freepik.com/free-vector/biometric-security-abstract-concept-illustration_335657-3882.jpg?t=st=1735715581~exp=1735719181~hmac=4d335078b64432b874d6428970f451404022585657477751211987835218830c&w=1380"
          alt="Face Recognition"
          className="relative z-10 w-4/5 h-auto object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500"
        />
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-8 md:px-16 relative z-20 bg-white/80 backdrop-blur-md">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-blue-900 tracking-tight mb-2">
              Smart{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                Attendance
              </span>
            </h1>
            <p className="text-gray-500 text-lg">
              Welcome back! Please login to continue.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          {/* 1️⃣ Standard Login Form */}
          <form onSubmit={handleStandardLogin} className="space-y-6 mt-8">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 ml-1 mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none"
                placeholder="kmitl_id@kmitl.ac.th"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 ml-1 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transform hover:-translate-y-0.5 transition-all duration-200"
            >
              Sign In
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-6">
            <div className="border-t border-gray-200 w-full"></div>
            <span className="bg-white px-4 text-sm text-gray-500 absolute z-10">
              OR
            </span>
          </div>

          {/* 2️⃣ Google Login Button */}
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => {
                console.log("Google Login Failed");
                setError("Google Login Failed");
              }}
              shape="circle"
              width="200"
              theme="filled_blue"
            />
          </div>

          {/* Footer */}
          <p className="text-center text-sm text-gray-500 mt-8">
            Don't have an account?{" "}
            <span className="font-semibold text-blue-600 hover:text-blue-500 cursor-pointer">
              Currently, please use Google Login.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
