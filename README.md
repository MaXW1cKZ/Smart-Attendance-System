# Smart Attendance System

This project contains the source code for the Smart Attendance System, split into a FastAPI backend and a React/Vite frontend.

## 📋 Prerequisites

Before starting, ensure you have the following installed on your MacBook:

1.  **Docker Desktop** (For the Database) - [Download Here](https://www.docker.com/products/docker-desktop/)
2.  **Python 3.10+** (For the Backend)
3.  **Node.js & npm** (For the Frontend) - [Download Here](https://nodejs.org/)

---

## 🚀 Quick Start Guide

Open your terminal and follow these steps in order.

### Step 1: Start the Database (Docker)

We use **PostgreSQL** with the **pgvector** extension running in a Docker container.

1.  Open a terminal in the **root project folder** (where `docker-compose.yml` is located).
2.  Start the database:
    ```bash
    docker compose up -d
    ```
3.  **Check if it's running:**
    ```bash
    docker ps
    ```
    *(You should see `smart_attendance_db` running on port 5432).*

> **⚠️ Troubleshooting Port 5432:**
> If you see a "Bind for 0.0.0.0:5432 failed" error, you likely have a local Postgres server running. Stop it with `brew services stop postgresql` or `sudo pkill -u postgres`.

---

### Step 2: Set Up the Backend (FastAPI)

1.  Open a **new terminal tab** and navigate to the backend folder:
    ```bash
    cd backend
    ```

2.  **Create and Activate Virtual Environment:**
    ```bash
    # Create venv (if not exists)
    python3 -m venv venv

    # Activate venv
    source venv/bin/activate
    ```
    *(Your terminal prompt should now show `(venv)`).*

3.  **Install Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Configure Environment Variables:**
    Create a `.env` file inside the `backend/` folder and add this content:
    ```ini
    DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/smart_attendance
    SECRET_KEY=supersecretkey123
    ALGORITHM=HS256
    ACCESS_TOKEN_EXPIRE_MINUTES=30
    ```

5.  **Run the Server:**
    **Important:** Run this command from the `backend` folder, NOT inside `app`.
    ```bash
    uvicorn app.main:app --reload
    ```

    * **Backend URL:** `http://127.0.0.1:8000`
    * **API Docs:** `http://127.0.0.1:8000/docs`

---

### Step 3: Set Up the Frontend (React + Vite)

1.  Open a **third terminal tab** and navigate to the frontend folder:
    ```bash
    cd frontend
    ```

2.  **Install Node Modules:**
    ```bash
    npm install
    ```

3.  **Run the Development Server:**
    ```bash
    npm run dev
    ```

    * **Frontend URL:** Usually `http://localhost:5173` (Check terminal for exact link).

---

## 📂 Project Structure

```text
├── docker-compose.yml      # Database configuration (Postgres + pgvector)
├── backend/                # FastAPI Backend
│   ├── .env                # Environment variables (create this manually)
│   ├── requirements.txt    # Python dependencies
│   ├── venv/               # Virtual Environment
│   └── app/                # Main Application Code
│       ├── main.py         # Entry point
│       ├── api/            # Route handlers
│       ├── core/           # Config and Database connections
│       ├── models/         # SQLAlchemy Database Models
│       └── schemas/        # Pydantic Models (Request/Response)
│
└── frontend/               # React Frontend
    ├── src/                # React Source Code
    ├── tailwind.config.js  # Tailwind CSS Config
    └── vite.config.js      # Vite Config