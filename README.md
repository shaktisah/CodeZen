# 🚀 CodeZen – AI-Powered Coding Platform

CodeZen is a full-stack coding platform inspired by LeetCode that enables developers to solve programming challenges, execute code in real time, and receive intelligent guidance from an AI-powered coding tutor.

## ✨ Features

### 📝 Online Coding Environment

* Solve coding challenges directly in the browser.
* Supports JavaScript, Python, C++, and Java.
* Run code against sample test cases.
* Submit solutions against hidden test cases.

### 🤖 AI Coding Tutor

* Powered by Google Gemini AI.
* Provides hints instead of direct answers.
* Explains algorithms, time complexity, and debugging strategies.
* Encourages problem-solving and interview-style thinking.

### 🔐 Authentication & Security

* JWT-based authentication.
* Secure route protection.
* Redis-powered token blacklisting for logout security.

### 👨‍💼 Admin Dashboard

* Create, edit, and delete coding problems.
* Manage test cases and starter code templates.
* Monitor platform content efficiently.

### 📊 User Analytics

* Track solved problems.
* View submission history.
* Monitor coding progress and performance statistics.

---

## 🛠 Tech Stack

### Frontend

* React
* Vite
* Redux Toolkit
* Tailwind CSS
* DaisyUI
* Axios

### Backend

* Node.js
* Express.js

### Database & Cache

* MongoDB
* Redis

### AI & External Services

* Google Gemini API
* OneCompiler API

---

## ⚙️ Environment Variables

Create a `.env` file inside the backend folder:

```env
PORT=4000

DB_CONNECT_STRING=mongodb://127.0.0.1:27017/CodeZen

JWT_KEY=your_jwt_secret_key

REDIS_HOST_ID=127.0.0.1
REDIS_PORT=6379

GEMINI_API_KEY=your_gemini_api_key

RAPIDAPI_KEY=your_rapidapi_key
RAPIDAPI_HOST=onecompiler-apis.p.rapidapi.com
```

---

## 🚀 Local Setup

### Clone Repository

```bash
git clone <repository-url>
cd CodeZen
```

### Backend Setup

```bash
cd backend

npm install

# Seed database (optional)
node seed.js

# Start server
node src/index.js
```

Backend runs on:

```text
http://localhost:4000
```

### Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

Frontend runs on:

```text
http://localhost:5173
```

---

## 🏗 Architecture

Frontend (React + Vite)
↓
Express Backend
↓
├── MongoDB (Data Storage)
├── Redis (Token Blacklisting)
├── Gemini API (AI Tutor)
└── OneCompiler API (Code Execution)

---

## 🎯 Key Design Decisions

### AI as a Tutor

The AI assistant is designed to guide users through problem-solving rather than providing direct solutions. This promotes learning and strengthens interview preparation skills.

### Secure Logout System

Logged-out JWT tokens are stored in Redis with an expiration time matching the token lifespan, preventing reuse of compromised tokens.

### Scalable Architecture

Frontend, backend, database, cache, AI services, and code execution services are separated for easier maintenance and scalability.

### Developer-Friendly Experience

Vite proxy configuration routes frontend API requests to the backend, eliminating CORS issues during development.

---

## 👨‍💻 Author

Shakti Sah

Built with React, Node.js, MongoDB, Redis, and Google Gemini AI.
