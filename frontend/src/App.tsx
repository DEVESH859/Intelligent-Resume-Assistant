import { useState, useCallback } from "react";
import UploadPanel from "./components/UploadPanel";
import ChatPanel from "./components/ChatPanel";
import type { ResumeData } from "./api/client";

function App() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [isAILoading, setIsAILoading] = useState(false);

  const handleUploaded = (sid: string, r: ResumeData) => {
    setSessionId(sid);
    setResume(r);
  };

  const handleReset = useCallback(() => {
    setSessionId(null);
    setResume(null);
  }, []);

  return (
    <div className="app">
      {/* Global AI progress bar */}
      {isAILoading && <div className="progress-bar" />}

      {/* Header */}
      <header className="header">
        <div className="header-logo">
          <div className="header-logo-icon">
            {/* Resume / spark SVG icon */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#fff" }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
          </div>
          <div>
            <div className="header-title">Intelligent Resume Assistant</div>
            <div className="header-subtitle">
              Agentic AI · Hallucination-Free · Structured Responses
            </div>
          </div>
        </div>
        <div className="header-badge">
          <span className="header-badge-dot" />
          Groq · Llama 3.3 70B · Skill Matcher
        </div>
      </header>

      {/* Workspace */}
      <main className="workspace">
        <UploadPanel
          onUploaded={handleUploaded}
          onReset={handleReset}
          resume={resume}
        />
        <ChatPanel
          sessionId={sessionId}
          hasResume={Boolean(resume)}
          onLoadingChange={setIsAILoading}
        />
      </main>
    </div>
  );
}

export default App;
