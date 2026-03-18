# Smart Attendance System

ระบบเช็คชื่อนักศึกษาอัตโนมัติด้วย Face Recognition สำหรับ KMITL

---

## Tech Stack

| ส่วน | เทคโนโลยี |
|------|-----------|
| Frontend | React 18, Vite, TailwindCSS, face-api.js |
| Backend | FastAPI, SQLAlchemy (Async), Python 3.11 |
| Database | PostgreSQL 16 + pgvector |
| AI | InsightFace (ArcFace model) + ONNX Runtime |
| Auth | JWT + Google OAuth 2.0 |
| Deploy | Docker, Docker Compose, Nginx |

> **หมายเหตุ:** ใช้ InsightFace + ONNX Runtime แทน DeepFace + TensorFlow เพื่อรองรับ CPU ที่ไม่มี AVX instruction set (เช่น KVM server)

---

## โครงสร้างโปรเจค

```
Smart-Attendance-System/
├── backend/                  ← FastAPI
│   ├── app/
│   │   ├── api/              ← Routers (auth, users, courses, face_register, attendance_check)
│   │   ├── core/             ← database.py, security.py
│   │   ├── models/           ← SQLAlchemy models
│   │   ├── schemas/          ← Pydantic schemas
│   │   └── main.py
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                 ← React
│   ├── public/
│   │   └── models/           ← face-api.js model files
│   ├── src/
│   │   ├── api/axios.js      ← Axios instance
│   │   ├── components/       ← Sidebar, ProtectedRoute
│   │   └── pages/            ← student/, teacher/, admin/
│   ├── Dockerfile
│   └── nginx-frontend.conf
├── nginx/
│   ├── nginx.conf            ← Reverse proxy + SSL config
│   └── ssl/                  ← SSL certificates (ห้าม commit!)
├── docker-compose.yml
├── .env                      ← ห้าม commit!
├── .env.example
└── README.md
```

---

## การติดตั้งและรันในเครื่อง (Local Development)

### 1. Clone โปรเจค

```bash
git clone https://github.com/MaXW1cKZ/Smart-Attendance-System.git
cd Smart-Attendance-System
```

### 2. สร้างไฟล์ .env

```bash
cp .env.example .env
```

แก้ไขค่าใน `.env`:

```env
POSTGRES_USER=your_db_user
POSTGRES_PASSWORD=your_db_password
POSTGRES_DB=attendance_db
DATABASE_URL=postgresql+asyncpg://your_db_user:your_db_password@db:5432/attendance_db

SECRET_KEY=your_secret_key_minimum_32_chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

GOOGLE_CLIENT_ID=your_google_client_id
```

สร้าง SECRET_KEY ด้วยคำสั่ง:
```bash
openssl rand -hex 32
```

### 3. สร้าง frontend/.env.local

```bash
echo "VITE_API_URL=/api" > frontend/.env.local
```

### 4. รัน Docker

```bash
docker compose up --build
```

เข้าเว็บได้ที่ `http://localhost`

---

## Deploy บน Server (HTTPS)

### ข้อมูล Server

| รายการ | ค่า |
|--------|-----|
| IP | 10.72.0.167 |
| User | it-student |
| URL | https://10.72.0.167.nip.io |

### ขั้นตอน

**1. SSH เข้า Server**
```bash
ssh it-student@10.72.0.167
```

**2. ติดตั้ง Docker (ถ้ายังไม่มี)**
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
```

**3. Clone โค้ด**
```bash
git clone https://github.com/MaXW1cKZ/Smart-Attendance-System.git
cd Smart-Attendance-System
```

**4. สร้าง .env และ frontend/.env.local**
```bash
cp .env.example .env
nano .env   # แก้ค่าให้ครบ
echo "VITE_API_URL=/api" > frontend/.env.local
```

**5. สร้าง SSL Certificate (Self-signed)**
```bash
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -subj "/CN=10.72.0.167.nip.io" \
  -addext "subjectAltName=DNS:10.72.0.167.nip.io,IP:10.72.0.167"
```

**6. Deploy**
```bash
docker compose up -d --build
```

เข้าเว็บได้ที่ `https://10.72.0.167.nip.io`

> **หมายเหตุ:** Browser จะแจ้งเตือน "Not Secure" ครั้งแรก ให้กด Advanced → Proceed ได้เลย เพราะใช้ Self-signed certificate

---

## Google OAuth Setup

1. ไปที่ [Google Cloud Console](https://console.cloud.google.com)
2. เลือกโปรเจค → **APIs & Services** → **Credentials**
3. เพิ่มใน **Authorized JavaScript origins**:
   - `http://localhost` (สำหรับ dev)
   - `https://10.72.0.167.nip.io` (สำหรับ production)
4. กด **Save**

> **หมายเหตุ:** Google ไม่รองรับ IP address โดยตรง ต้องใช้ domain name เท่านั้น

---

## การแก้ปัญหาที่พบบน KVM Server (ไม่มี AVX)

Server KVM รุ่นเก่าที่มี CPU รองรับแค่ SSE/SSE2 จะ crash เมื่อรัน TensorFlow (exit code 132 = Illegal Instruction)

**วิธีแก้:** โปรเจคนี้ใช้ **InsightFace + ONNX Runtime** แทน DeepFace + TensorFlow ซึ่งไม่ต้องการ AVX และให้ ArcFace embedding 512 มิติเหมือนกัน

ตรวจสอบ CPU ของ server:
```bash
grep flags /proc/cpuinfo | head -1 | tr ' ' '\n' | grep -E 'avx|sse'
```

ถ้ามีแค่ `sse` และ `sse2` ให้ใช้ requirements.txt ของโปรเจคนี้ได้เลย (ไม่มี TensorFlow)

---

## การจัดการ User Roles

เชื่อมต่อ Database ด้วย DBeaver หรือ tool อื่น:

| รายการ | ค่า |
|--------|-----|
| Host | 10.72.0.167 |
| Port | 5433 |
| Database | attendance_db |
| Username | ตามค่าใน .env |
| Password | ตามค่าใน .env |

เปลี่ยน role ของ user:
```sql
-- ดู users ทั้งหมด
SELECT id, email, full_name, role FROM users;

-- เปลี่ยนเป็น teacher
UPDATE users SET role = 'teacher' WHERE email = 'email@example.com';

-- เปลี่ยนเป็น admin
UPDATE users SET role = 'admin' WHERE email = 'email@example.com';
```

---

## Roles และสิทธิ์การใช้งาน

| Role | สิทธิ์ |
|------|--------|
| `student` | Dashboard, ลงทะเบียนใบหน้า, เข้าร่วมวิชา, ดูประวัติการเข้าเรียน |
| `teacher` | สร้างวิชา, เริ่ม session, ดู attendance report |
| `admin` | จัดการ user, ดู report ทั้งหมด |

---

## คำสั่งที่ใช้บ่อย

```bash
# ดู log แบบ real-time
docker compose logs -f

# ดู log เฉพาะ service
docker compose logs -f backend

# Restart service เดียว
docker compose restart backend

# อัปเดตโค้ดใหม่
git pull
docker compose up -d --build

# หยุดทั้งหมด (เก็บข้อมูล DB)
docker compose down

# หยุดและลบข้อมูล DB ทั้งหมด ⚠️
docker compose down -v

# เช็คสถานะ container
docker compose ps
```

---

## ถ้าได้ Domain จริงในอนาคต

เปลี่ยนจาก Self-signed เป็น Let's Encrypt:

```bash
# ติดตั้ง certbot
apt install certbot python3-certbot-nginx

# ขอ certificate
certbot --nginx -d your-domain.kmitl.ac.th
```

**Face Register ใช้ไม่ได้ (Loading AI...)**
- ตรวจสอบว่ามีไฟล์ model ใน `frontend/public/models/`
- ต้องมีทั้ง `*-weights_manifest.json` และ `*-shard1`

**Backend ต่อ DB ไม่ได้**
- ตรวจสอบค่าใน `.env` ว่า `DATABASE_URL` ถูกต้อง
- รัน `docker compose down` แล้ว `docker compose up -d --build` ใหม่
=======
แล้วแก้ `nginx/nginx.conf` เปลี่ยน path ของ certificate เป็น:
```
ssl_certificate /etc/letsencrypt/live/your-domain/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/your-domain/privkey.pem;
```
