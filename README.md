# 🚀 AI Career Guidance System – Personalized Roadmap Generator

> An AI-powered adaptive career assessment platform that analyzes student interests, identifies strengths, and generates structured career roadmaps using intelligent decision logic and NLP techniques.

---

## 📌 Problem Statement

Many students struggle with:

- ❓ Career confusion and lack of clarity  
- 📉 Choosing careers based on trends instead of strengths  
- 📚 No structured roadmap to achieve career goals  
- 📊 No skill gap awareness  
- 🧠 No personalized mentoring  

---

## 💡 Solution – AI Career Guidance System

This platform provides:

- 🎯 Adaptive Career Assessment (6-step structured interview)
- 🧠 NLP-based career classification
- 📊 Strength profile generation
- 🛤️ Beginner → Intermediate → Advanced roadmap
- 📉 Skill gap analysis
- 🔐 Secure authentication (JWT + Google SSO)
- 📦 MongoDB-based persistent user tracking
- 📊 Activity logging & progress tracking

The system dynamically generates roadmaps based on user responses and stores personalized results.

---

## 🏗️ System Architecture

Frontend:
- Next.js (App Router)
- TypeScript
- Responsive UI

Backend:
- Next.js API Routes (Serverless)
- Node.js Runtime
- REST API architecture

Database:
- MongoDB (Atlas)

AI Layer:
- Rule-based NLP classification
- Optional Gemini LLM integration
- Template-based roadmap engine
- Adaptive question engine

Authentication:
- JWT (HTTP-only cookies)
- Google OAuth 2.0 

---

## 🧠 Core Features

### 1️⃣ Career Assessment Engine
- Common first question for all users
- Adaptive follow-up questions
- Context-aware progression
- No repeated questions
- Stores answers in MongoDB

---

### 2️⃣ Career Classification
System categorizes user interest into:

- Sports
- Technology
- Business
- Creative
- Education
- Government
- General

---

### 3️⃣ Roadmap Generation
Each career includes structured stages:

Beginner Stage:
- Foundation training
- Basic skill development

Intermediate Stage:
- Real-world exposure
- Advanced skill building

Advanced Stage:
- Professional preparation
- Industry readiness

---

### 4️⃣ Strength Profile
Generates:
- Strength summary
- Career persona
- Suggested career title
- Motivation style

---

### 5️⃣ Skill Gap Analysis
Compares user answers with required skills and outputs:

- Readiness percentage
- Missing skills
- Improvement suggestions

---

### 6️⃣ Dashboard System
Displays:
- Welcome message
- Assessment status
- Strength summary
- Roadmap access
- Activity history

---

### 7️⃣ Persistent Login
- HTTP-only JWT cookie
- Session persistence across reload
- Fetches user from MongoDB on refresh
- Role-based dashboard rendering

---

## 📂 Database Schema Overview

Collections:

- USER
- ASSESSMENT
- ROADMAP
- ACTIVITY_LOG

Relationships:

- USER → 1:1 → ASSESSMENT
- USER → 1:1 → ROADMAP
- USER → 1:N → ACTIVITY_LOG

---

## 🔐 Security Features

- Password hashing (bcrypt)
- JWT token verification
- Secure cookie handling
- MongoDB Atlas IP whitelist
- Role-based access control

---

## ⚙️ How to Run Locally

Clone repository:

git clone https://github.com/your-username/ai-career-guidance.git

Navigate into project:

cd ai-career-guidance

Install dependencies:

npm install

Create environment file:

cp .env.example .env.local

Edit `.env.local`:

MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id

Run development server:

npm run dev

Open:

http://localhost:3000

---

## 📊 Assessment Flow

Landing Page  
→ Login / Google Sign-In  
→ Start Career Assessment  
→ 6 Adaptive Questions  
→ Strength Profile Generated  
→ Roadmap Created  
→ Dashboard Display  
→ Skill Gap Analysis  

---

## 🎯 Expected Outcomes

- Personalized career clarity  
- Structured roadmap  
- Improved decision confidence  
- Clear skill development path  
- Continuous progress tracking  

---

## 🌟 Vision

To build an intelligent career guidance engine that adapts to individual strengths and generates actionable career roadmaps instead of static suggestions.

---

## 🧪 Future Enhancements

- Resume builder
- Internship recommendations
- Career comparison engine
- AI coaching chatbot
- Readiness scoring system
- Voice-based assessment
- Mentor marketplace

---

## 🎓 Academic Value

This project demonstrates:

- Full-stack development
- REST API architecture
- MongoDB schema design
- JWT authentication
- Google OAuth integration
- Adaptive logic system
- NLP-based classification
- Roadmap generation engine
- Secure session persistence

---

## 📌 Project Status

✔ Authentication complete  
✔ Adaptive assessment complete  
✔ Roadmap generation complete  
✔ MongoDB persistence complete  
✔ Session persistence implemented  

Next Phase:
- Advanced skill gap intelligence
- Coaching engine expansion
- Performance optimization
