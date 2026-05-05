import { useState } from "react";
import type { AgentResponse } from "../api/client";
import ConfidenceBadge from "./ConfidenceBadge";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string | AgentResponse;
}

const UserAvatarIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const AiAvatarIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
  </svg>
);

const CopyIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const WarnIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const DocIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);

const ToolIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
  </svg>
);

const LightbulbIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/>
    <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>
  </svg>
);

/** Render **bold** text and newlines */
function renderAnswer(text: string) {
  return text.split("\n").map((line, li) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <span key={li}>
        {parts.map((part, pi) =>
          part.startsWith("**") && part.endsWith("**")
            ? <strong key={pi}>{part.slice(2, -2)}</strong>
            : part
        )}
        {li < text.split("\n").length - 1 && <br />}
      </span>
    );
  });
}

export default function MessageBubble({ role, content }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);

  if (role === "user") {
    return (
      <div className="message user">
        <div className="message-avatar"><UserAvatarIcon /></div>
        <div className="message-body">
          <div className="message-bubble">{content as string}</div>
        </div>
      </div>
    );
  }

  const resp = content as AgentResponse;

  const handleCopy = () => {
    navigator.clipboard.writeText(resp.answer).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const sourceIcon =
    resp.source === "tool" ? <ToolIcon /> :
    resp.source === "resume" ? <DocIcon /> :
    <LightbulbIcon />;

  const sourceLabel =
    resp.source === "tool" ? "tool" :
    resp.source === "resume" ? "resume" :
    "inference";

  return (
    <div className="message assistant">
      <div className="message-avatar"><AiAvatarIcon /></div>
      <div className="message-body">
        <div className="message-bubble" style={{ position: "relative" }}>
          {/* Copy button */}
          <button
            onClick={handleCopy}
            title={copied ? "Copied!" : "Copy response"}
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              background: "none",
              border: "1px solid rgba(99,102,241,0.2)",
              borderRadius: 6,
              color: copied ? "var(--success)" : "var(--text-muted)",
              cursor: "pointer",
              padding: "3px 6px",
              display: "flex",
              alignItems: "center",
              gap: 3,
              fontSize: "0.65rem",
              transition: "all 0.2s",
              backdropFilter: "blur(4px)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.2)")}
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
            {copied ? "Copied" : "Copy"}
          </button>

          <div className="response-answer" style={{ paddingRight: 56 }}>
            {renderAnswer(resp.answer)}
          </div>

          {resp.missing_data && resp.missing_data.length > 0 && (
            <div className="missing-data">
              <WarnIcon />
              <span>Missing: <strong>{resp.missing_data.join(", ")}</strong></span>
            </div>
          )}

          <div className="response-meta">
            <ConfidenceBadge confidence={resp.confidence} />
            <span className={`source-tag ${resp.source}`} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {sourceIcon}
              {sourceLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
