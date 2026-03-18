# Smart Attendance System

ระบบเช็คชื่อนักศึกษาอัตโนมัติด้วย Face Recognition สำหรับ KMITL

---

## Tech Stack

| ส่วน | เทคโนโลยี |
|------|-----------|
| Frontend | React 18, Vite, TailwindCSS, face-api.js |
| Backend | FastAPI, SQLAlchemy (Async), Python 3.11 |
| Database | PostgreSQL 16 + pgvector |
| AI | DeepFace (ArcFace model) |
| Auth | JWT + Google OAuth 2.0 |
| Deploy | Docker, Docker Compose, Nginx |

---

## โครงสร้างโปรเจค

```
Smart-Attendance-System/
├── backend/                  ← FastAPI
│   ├── app/
│   │   ├── api/              ← Routers (auth, users, courses, ...)
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
│   └── nginx.conf            ← Reverse proxy config
├── docker-compose.yml
├── .env                      ← ห้าม commit!
├── .env.example
└── README.md
```

---

## การติดตั้งและรันในเครื่อง (Local Development)

### 1. Clone โปรเจค

```bash
git clone https://github.com/your-repo/Smart-Attendance-System.git
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

> **หมายเหตุ:** build ครั้งแรกใช้เวลานาน (~10-20 นาที) เพราะ DeepFace ต้องดาวน์โหลด TensorFlow

---

## Deploy บน Server

### ข้อมูล Server

| รายการ | ค่า |
|--------|-----|
| IP | 10.72.0.167 |
| User | it-student |

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
git clone https://github.com/your-repo/Smart-Attendance-System.git
cd Smart-Attendance-System
```

**4. สร้าง .env และ frontend/.env.local**
```bash
cp .env.example .env
nano .env   # แก้ค่าให้ครบ

echo "VITE_API_URL=/api" > frontend/.env.local
```

**5. Deploy**
```bash
docker compose up -d --build
```

เข้าเว็บได้ที่ `http://10.72.0.167`

---

## Google OAuth Setup

1. ไปที่ [Google Cloud Console](https://console.cloud.google.com)
2. เลือกโปรเจค → **APIs & Services** → **Credentials**
3. เพิ่มใน **Authorized JavaScript origins**:
   - `http://localhost` (สำหรับ dev)
   - `http://your-domain.it.kmitl.ac.th` (สำหรับ production)
4. กด **Save**

> **หมายเหตุ:** Google ไม่รองรับ IP address โดยตรง ต้องใช้ domain name เท่านั้น

---

## การจัดการ User Roles

เชื่อมต่อ Database ด้วย DBeaver หรือ tool อื่น:

| รายการ | ค่า |
|--------|-----|
| Host | localhost |
| Port | 5433 (Docker) หรือ 5432 (ถ้าไม่มี local PostgreSQL) |
| Database | attendance_db (ตามค่าใน .env) |
| Username | ตามค่าใน .env |
| Password | ตามค่าใน .env |

เปลี่ยน role ของ user:
```sql
-- เปลี่ยนเป็น teacher
UPDATE users SET role = 'teacher' WHERE email = 'email@example.com';

-- เปลี่ยนเป็น admin
UPDATE users SET role = 'admin' WHERE email = 'email@example.com';

-- ดู users ทั้งหมด
SELECT id, email, full_name, role FROM users;
```

---

## คำสั่งที่ใช้บ่อย

```bash
# ดู log แบบ real-time
docker compose logs -f

# ดู log เฉพาะ service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f nginx

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

## Roles และสิทธิ์การใช้งาน

| Role | สิทธิ์ |
|------|--------|
| `student` | Dashboard, ลงทะเบียนใบหน้า, เข้าร่วมวิชา, ดูประวัติการเข้าเรียน |
| `teacher` | สร้างวิชา, เริ่ม session, ดู attendance report |
| `admin` | จัดการ user, ดู report ทั้งหมด |

---

## การแก้ปัญหาที่พบบ่อย

**502 Bad Gateway หลัง build ใหม่**
```bash
docker compose down
docker compose up -d --build
```

**Face Register ใช้ไม่ได้ (Loading AI...)**
- ตรวจสอบว่ามีไฟล์ model ใน `frontend/public/models/`
- ต้องมีทั้ง `*-weights_manifest.json` และ `*-shard1`

**Backend ต่อ DB ไม่ได้**
- ตรวจสอบค่าใน `.env` ว่า `DATABASE_URL` ถูกต้อง
- รัน `docker compose down` แล้ว `docker compose up -d --build` ใหม่
