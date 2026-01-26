import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { GoogleOAuthProvider } from '@react-oauth/google'; // <--- 1. เพิ่มบรรทัดนี้

// 2. เอา Client ID ของคุณมาใส่ตรงนี้
const GOOGLE_CLIENT_ID = "291635293570-f2ng0herj90g22t9oh05njonaas4l8dj.apps.googleusercontent.com"; 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 3. ครอบ App ด้วย Provider */}
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>,
)