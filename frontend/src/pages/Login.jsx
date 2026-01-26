import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google'; // Import Google Component

// Import Assets
import illustration from '../assets/login-bg.png';
// import kmitlLogo from '../assets/kmitl-logo.png'; // (ถ้าจะเอาปุ่ม KMITL ออก ก็คอมเมนต์บรรทัดนี้ได้ครับ)

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    username: '', 
    password: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- 1. ฟังก์ชัน Login ปกติ ---
  const handleLogin = async (e) => {
    e.preventDefault(); 
    setError('');

    try {
      const params = new URLSearchParams();
      params.append('username', formData.username);
      params.append('password', formData.password);

      const response = await axios.post('http://127.0.0.1:8000/token', params);

      const token = response.data.access_token;
      localStorage.setItem('token', token);
      
      alert("Login สำเร็จ! ได้ Token แล้ว");
      console.log("Token:", token);
      
      navigate('/dashboard'); 

    } catch (err) {
      console.error(err);
      setError('Login ไม่ผ่าน! อีเมลหรือรหัสผ่านผิดครับ');
    }
  };

  // --- 2. ฟังก์ชัน Google Login (ย้ายออกมาให้อยู่ข้างนอก handleLogin) ---
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
        console.log("Google Token:", credentialResponse.credential);

        // ส่ง Token ไปให้ Backend ตรวจสอบ
        const res = await axios.post('http://127.0.0.1:8000/google-login', {
            token: credentialResponse.credential
        });

        const { access_token } = res.data;

        localStorage.setItem('token', access_token);
        alert("Login ด้วย Google สำเร็จ!");

        navigate('/dashboard');

    } catch (err) {
        console.error("Google Login Error:", err);
        alert("เกิดข้อผิดพลาดในการเชื่อมต่อกับ Server");
    }
  };

  return (
    <div className="flex h-screen w-full bg-white font-sans">
      {/* --- Left Side --- */}
      <div className="hidden md:flex w-1/2 flex-col justify-center items-center p-10 relative">
        <div className="w-full max-w-lg">
            <h1 className="text-4xl font-bold text-black mb-2">Welcome to</h1>
            <h1 className="text-4xl font-bold text-black mb-8">Smart Attendance</h1>
            <div className="border-4 border-blue-400 rounded-lg p-2 overflow-hidden">
                <img src={illustration} alt="Login Illustration" className="w-full h-auto object-cover"/>
            </div>
        </div>
      </div>

      {/* --- Right Side --- */}
      <div className="w-full md:w-1/2 flex justify-center items-center bg-white p-8">
        <div className="w-full max-w-md">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-black">Sign in</h2>
            <div className="text-sm text-gray-500 cursor-pointer">English ▼</div>
          </div>

          {error && <div className="mb-4 text-red-500 text-sm text-center">{error}</div>}

          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <input
                name="username"
                value={formData.username}
                onChange={handleChange}
                type="text"
                placeholder="Enter Email"
                className="w-full bg-gray-50 border border-gray-200 text-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 transition"
                required
              />
            </div>

            <div className="mb-2 relative">
              <input
                name="password"
                value={formData.password}
                onChange={handleChange}
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="w-full bg-gray-50 border border-gray-200 text-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 transition"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </button>
            </div>

            <div className="flex justify-end mb-6">
              <a href="#" className="text-sm text-gray-500 hover:text-blue-600">Recover Password ?</a>
            </div>

            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg shadow-md transition duration-200 mb-4">
              Sign in
            </button>
            
            <button type="button" className="w-full bg-sky-400 hover:bg-sky-500 text-white font-semibold py-3 rounded-lg shadow-md transition duration-200 mb-6">
              Register
            </button>
          </form>

          {/* --- ส่วนปุ่ม Social Login --- */}
          <div className="relative flex py-2 items-center mb-6">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">Or continue with</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>
          
          {/* ✅ ใส่ปุ่ม Google Login ตรงนี้ครับ */}
          <div className="flex justify-center gap-4">
            <GoogleLogin 
                onSuccess={handleGoogleSuccess} 
                onError={() => { 
                    console.log('Login Failed'); 
                    alert("Login ล้มเหลว"); 
                }} 
                useOneTap 
                shape="circle" // ปรับทรงปุ่ม (optional)
            />
            
            {/* ถ้าอยากเก็บปุ่ม KMITL ไว้ด้วย ให้เปิดคอมเมนต์บรรทัดล่างนี้ครับ */}
            {/* <button className="p-2 rounded-xl hover:bg-gray-50 border border-gray-100 shadow-sm transition">
               <img src={kmitlLogo} alt="Logo" className="w-10 h-10" />
            </button> 
            */}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;