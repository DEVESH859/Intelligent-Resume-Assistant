# 🧠 Intelligent Resume Assistant

![Intelligent Resume Assistant](https://img.shields.io/badge/Status-Live-success) ![License](https://img.shields.io/badge/License-MIT-blue) ![Version](https://img.shields.io/badge/Version-1.0.0-purple)

![App Interface](assets/hero.png)
The **Intelligent Resume Assistant** is a production-ready, agentic AI application designed for recruiters, hiring managers, and HR professionals. It allows users to upload a candidate's resume (PDF or text) and instantly interact with a highly-focused, **hallucination-free** AI agent to query the candidate's skills, experience, and qualifications.

---

## 🌟 Why We Built This

Traditional LLMs (like standard ChatGPT) suffer from a major flaw when reviewing resumes: **Hallucination**. If you ask standard AI if a candidate knows a specific skill, the AI will often guess, assume, or hallucinate based on the candidate's general job title. 

We built the Intelligent Resume Assistant to solve this problem by implementing a strict, deterministic agentic pipeline that guarantees the AI **only** answers based on what is explicitly written in the resume document. 

### Key Design Philosophies:
- **Zero Hallucination Guarantee:** The AI is strictly prompted to refuse answering if data is not present in the text.
- **Lightning Fast Inference:** By utilizing Groq's LPUs, resume parsing and chat responses happen in milliseconds.
- **Deterministic Skill Matching:** We bypass the LLM entirely for direct "Does the candidate know X?" queries, using heuristic regex and fuzzy string matching to ensure 100% accuracy.

---

## 🚀 Key Features

1. **Intelligent PDF Parsing**  
   Automatically extracts raw text from complex PDF layouts using the lightweight `PyPDF2` library (to prevent cloud memory limits). The text is then processed by a `temperature=0.0` LLM call to perfectly structure it into strict JSON (Name, Email, Skills, Experience, etc.) without any hallucination.

2. **Deep Narrative Integrity Audits**  
   The AI proactively acts as a detective. It scans the candidate's career history for timeline contradictions, unexplained gaps exceeding 6 months, and inconsistent seniority (e.g., claiming to be a CEO with only 1 year of experience). It automatically flags these red flags in its responses.

3. **Self-Auditing Bias Scoring**  
   To ensure fair hiring practices, every LLM response evaluates its own reasoning for potential biases regarding protected characteristics (gender, age, ethnicity). It assigns itself a confidence penalty if biased language or assumptions are detected, ensuring objective evaluations.

4. **Context-Aware Chat Agent**  
   Users can ask dynamic, conversational questions (e.g., "Is this candidate suitable for a Senior Backend role?"). The AI evaluates the structured resume data and answers with citations, dynamic confidence scores, and `[Hidden Insights]` that infer soft skills or domain exposure from the text.

5. **Deterministic Intent Detection System**  
   The backend intercepts all chat messages to detect the user's intent. If the user asks a binary skill question ("Does he know Python?"), the system completely bypasses the LLM and routes the request to a deterministic heuristic regex and fuzzy-matcher to guarantee 100% absolute accuracy and prevent LLM hallucination on boolean logic.

6. **Cloud-Optimized Architecture**  
   Designed to run seamlessly within free-tier cloud constraints. Handles cold-starts gracefully and uses highly-optimized Python dependencies to respect tight 512MB RAM limits on platforms like Render.

---

## 📸 Screenshots & Capabilities

Our chat agent dynamically supports various types of analysis:

**Deep Career Evaluation & Bias Scoring**  
![Career Evaluation](assets/demo4.png)

**Narrative Integrity Audits**  
![Narrative Integrity](assets/demo2.png)

**Project Extraction & Hidden Insights**  
![Hidden Insights](assets/demo3.png)

**Instant Deterministic Skill Matching**  
![Skill Matcher](assets/demo1.png)

---

## 🛠️ Technology Stack

### **Frontend (Vercel)**
- **React 18 & TypeScript:** For a robust, type-safe user interface.
- **Vite:** Next-generation frontend tooling for rapid development.
- **Axios:** For robust API communication (with custom configurations to prevent multipart boundary stripping).
- **Vanilla CSS:** Custom, modern dark-mode aesthetic featuring glassmorphism and smooth micro-animations.

### **Backend (Render)**
- **FastAPI (Python):** High-performance backend framework for handling concurrent requests.
- **Groq API:** Powering the core LLM intelligence.
- **Llama 3.3 70B Versatile:** The specific LLM model chosen for its immense reasoning capabilities and strict adherence to JSON output schemas.
- **PyPDF2:** A lightweight, memory-efficient PDF parser specifically chosen to prevent Out-Of-Memory (OOM) crashes on cloud deployment environments.

---

## 📁 Project Structure

### Backend (FastAPI / Python)
- `backend/main.py`: The FastAPI application entry point, CORS configuration, and routing logic.
- `backend/agent.py`: The core LLM orchestration, intent detection, and Groq API communication logic.
- `backend/prompts.py`: Strict system prompts enforcing structured JSON output, Narrative Integrity, and Bias Scoring.
- `backend/models.py`: Pydantic data models for type-safe API requests and responses.
- `backend/memory.py`: In-memory session management to track conversation history per user.
- `backend/tools/resume_parser.py`: Extracts raw text from uploaded PDFs and structures it via LLM.
- `backend/tools/skill_matcher.py`: Deterministic heuristic regex and fuzzy-matching logic for direct skill queries.

### Frontend (React / TypeScript / Vite)
- `frontend/src/App.tsx`: Main application layout and global state management.
- `frontend/src/index.css`: Custom vanilla CSS design system featuring glassmorphism and micro-animations.
- `frontend/src/api/client.ts`: Axios client configuration for robust backend communication.
- `frontend/src/components/UploadPanel.tsx`: Interactive drag-and-drop resume upload zone.
- `frontend/src/components/ChatPanel.tsx`: Main conversational interface displaying AI reasoning and insights.
- `frontend/src/components/MessageBubble.tsx`: Renders individual chat messages, confidence scores, and missing data tags.
- `frontend/src/components/ConfidenceBadge.tsx`: Visual indicators for AI confidence levels and data sources.

---

## 🏗️ Architecture & Flow

1. **Upload Phase:** 
   - Browser sends `multipart/form-data` to FastAPI.
   - FastAPI uses `PyPDF2` to extract raw string data.
   - Groq API is called to format the string into a structured `Resume` JSON object.
   - A unique `session_id` is generated and stored in-memory.
2. **Chat Phase:**
   - User types a prompt.
   - `agent.py` detects the intent of the prompt.
   - If a standard question, it retrieves the `session_id` memory and passes the history + the parsed JSON resume to the `llama-3.3-70b-versatile` model.
   - The model returns a structured JSON answer, which is parsed by FastAPI and sent back to the React frontend.

---

## ⚙️ Local Development Setup

### 1. Clone the repository
```bash
git clone https://github.com/DEVESH859/Intelligent-Resume-Assistant.git
cd Intelligent-Resume-Assistant
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```
Create a `.env` file in the `backend` directory:
```env
GROQ_API_KEY=your_groq_api_key_here
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```
Create a `.env.local` file in the `frontend` directory:
```env
VITE_API_URL=http://localhost:8000
```

### 4. Run the Application
You can start both the frontend and backend simultaneously by running the provided batch script from the root directory:
```cmd
start.bat
```

---

## ☁️ Deployment Log & Decisions

- **Why PyPDF2 instead of pdfplumber?** Initially, the app used `pdfplumber` for advanced extraction. However, `pdfplumber` frequently exceeded the 512MB RAM limit on Render's free tier, causing the server to silently crash and throw 502/Network Errors. Switching to `PyPDF2` resolved all memory-related deployment crashes.
- **CORS & Axios Fix:** Explicit `Content-Type` headers were removed from Axios file uploads to allow the browser to auto-generate multipart boundaries, preventing mysterious connection drops in production.
- **Vercel Env Vars:** The frontend falls back to the hardcoded Render URL to ensure robust production connectivity even if Vercel build environment variables fail to inject properly.
