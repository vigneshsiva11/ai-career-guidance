# 🌍 Classless – Inclusive AI Tutor for All

> **Breaking barriers in education** – An AI-powered learning platform designed to reach every student, whether they have a smartphone, a feature phone, or no personal device at all.

---

## 🚀 Problem Statement

In India, millions of rural and low-income students are **left behind in the digital education revolution** because:

- 📱 Limited or no access to smartphones (shared within families).
- 🌐 Poor or no internet connectivity in villages.
- 🗣️ Existing ed-tech apps prioritize English/urban users, ignoring local languages.
- ❓ Students lack reliable after-school doubt-solving support.

The result? A growing education gap between urban and rural learners.

---

## 💡 Solution – Classless

Classless is an **inclusive AI tutor** that ensures every student can learn, regardless of their access to technology.

**Smartphone / Web App** – AI tutor with step-by-step explanations in local languages.
**SMS Mode (Feature Phones)** – Students text questions, receive AI-powered answers via SMS.
**IVR (Call-in Tutor)** – Students call a toll-free number, ask in their language, and get spoken answers.
**Community Learning Stations** – Shared devices in schools or panchayat centers for group learning.

Beyond tutoring, Classless also connects students to **scholarships, government schemes, and free learning resources**.

---

## 🛠️ Implementation

- **Offline-first React/React Native app** for reliable learning even with weak internet.
- **Node.js + Express.js backend** with PostgreSQL for queries, users, and resource management.
- **Multilingual AI/NLP** using Hugging Face & OpenAI for natural doubt-solving in regional languages.
- **SMS & IVR Integration** via Twilio/Exotel APIs.
- **OCR (Tesseract.js)** for scanning handwritten questions.
- **Google Speech APIs** for speech-to-text and text-to-speech support in IVR.

---

## 🎯 Outcomes

- 📚 Provided **affordable and accessible tutoring** to underserved students.
- 🌐 Enabled **multi-channel learning** (App, SMS, IVR, shared stations).
- 🗣️ Supported **local languages and dialects**, making learning culturally relevant.
- 🤝 Bridged the education gap by ensuring **no student is left behind**.

---

## 🖥️ Tech Stack

- **Frontend:** React.js, React Native (offline-first)
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL
- **AI/NLP:** Hugging Face, OpenAI models
- **OCR & Speech:** Tesseract.js, Google Speech-to-Text & Text-to-Speech
- **SMS/IVR:** Twilio, Exotel APIs

---

## 🌟 Vision

Education should not be a privilege.
**Classless is built on the belief that every student, no matter where they live or what device they own, deserves access to quality learning.**

---

## 📌 How to Run Locally

```bash
# Clone repository
git clone https://github.com/vigneshsiva11/classless-app.git

# Navigate to project
cd classless-app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local and add your API keys:
# OPENAI_API_KEY=sk-your-openai-key-here
# GEMINI_API_KEY=your-gemini-key-here
# (Optional for RAG) Pinecone Vector DB
# PINECONE_API_KEY=your-pinecone-key
# PINECONE_INDEX=your-index-name

# Run the development server
npm run dev
```

## 📚 RAG (Retrieval-Augmented Generation)

We include a RAG Tutor for syllabus-based Q&A.

### 1) Install additional dependencies

```bash
npm i @pinecone-database/pinecone tsx
```

### 2) Environment variables

Add to `.env.local` and Vercel Project Settings → Environment Variables:

```
GEMINI_API_KEY=...
PINECONE_API_KEY=...
PINECONE_INDEX=classless-rag
```

### 3) Create a Pinecone index

- Metric: cosine
- Dimension: 768 (Gemini text-embedding-004)

### 4) Ingest syllabus content

Place `.txt` or `.md` files under `content/` (each file will be chunked ~300 words), then run:

```bash
npm run ingest:rag -- ./content
```

### 5) Use in the app

- Student Dashboard → “RAG Tutor” → `/rag`
- Backend endpoint: `/api/ai/rag` (uses Pinecone if configured, else in-memory demo corpus)

## 🎤 Voice-to-Text Setup

For accurate voice-to-text transcription, set up OpenAI Whisper API:

1. **Get OpenAI API Key**: Visit [OpenAI Platform](https://platform.openai.com/) and create an API key
2. **Configure Environment**: Add `OPENAI_API_KEY=sk-your-key-here` to your `.env.local` file
3. **Test Transcription**: Visit `/test-openai-transcription.html` to test voice transcription

See [OPENAI_SETUP.md](./OPENAI_SETUP.md) for detailed setup instructions.

## 🧪 Testing Voice Transcription

1. Open `http://localhost:3000/test-openai-transcription.html`
2. Click "Start Recording" and speak your question
3. Click "Stop Recording" when done
4. Click "Transcribe" to convert speech to text
5. The system will use OpenAI Whisper for accurate transcription

---
