import {
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import type { KeyboardEvent } from "react";
import type { AgentResponse } from "../api/client";
import { sendChat } from "../api/client";
import MessageBubble from "./MessageBubble";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string | AgentResponse;
}

interface ChatPanelProps {
  sessionId: string | null;
  hasResume: boolean;
  onLoadingChange?: (loading: boolean) => void;
}

const SUGGESTIONS = [
  "Summarize this candidate",
  "List all technical skills",
  "Evaluate for a Senior Data Scientist role",
  "How many years of experience?",
  "What is the educational background?",
  "Does this candidate know Python?",
];

// SVG send icon
const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

// Step guide icons
const UploadIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

const ParseIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
  </svg>
);

const ChatIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const ArrowRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
);

const EmptyChatIcon = () => (
  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);

const ReadyIcon = () => (
  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    <line x1="9" y1="10" x2="15" y2="10"/>
    <line x1="12" y1="7" x2="12" y2="13"/>
  </svg>
);

export default function ChatPanel({ sessionId, hasResume, onLoadingChange }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    setMessages([]);
    setError(null);
  }, [sessionId]);

  const resizeTextarea = () => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "24px";
      ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
    }
  };

  const sendMessage = useCallback(
    async (text: string) => {
      if (!sessionId || !text.trim() || isLoading) return;

      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content: text.trim(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setError(null);
      setIsLoading(true);
      onLoadingChange?.(true);

      if (textareaRef.current) textareaRef.current.style.height = "24px";

      try {
        const result = await sendChat(sessionId, text.trim());
        const assistantMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: result.response,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch (e: unknown) {
        const detail =
          (e as { response?: { data?: { detail?: string } } })?.response?.data
            ?.detail || "Something went wrong. Please try again.";
        setError(detail);
        setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
      } finally {
        setIsLoading(false);
        onLoadingChange?.(false);
        textareaRef.current?.focus();
      }
    },
    [sessionId, isLoading, onLoadingChange]
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const canSend = Boolean(sessionId && hasResume && input.trim() && !isLoading);

  if (!hasResume) {
    return (
      <div className="chat-panel">
        <div className="chat-bg-grid" />
        <div className="chat-empty">
          <div className="chat-empty-icon"><EmptyChatIcon /></div>
          <div className="chat-empty-title">How it works</div>
          <div className="chat-empty-desc">
            Upload a resume, then ask any hiring-related question.
          </div>
          <div className="step-guide">
            <div className="step-card">
              <div className="step-num">1</div>
              <div className="step-icon"><UploadIcon /></div>
              <div className="step-label">Upload<br/>Resume</div>
            </div>
            <div className="step-arrow"><ArrowRight /></div>
            <div className="step-card">
              <div className="step-num">2</div>
              <div className="step-icon"><ParseIcon /></div>
              <div className="step-label">AI Parses<br/>&amp; Structures</div>
            </div>
            <div className="step-arrow"><ArrowRight /></div>
            <div className="step-card">
              <div className="step-num">3</div>
              <div className="step-icon"><ChatIcon /></div>
              <div className="step-label">Ask Hiring<br/>Questions</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-panel">
      <div className="chat-bg-grid" />

      {messages.length === 0 ? (
        <div className="chat-empty" style={{ flex: 1 }}>
          <div className="chat-empty-icon"><ReadyIcon /></div>
          <div className="chat-empty-title">Resume ready — ask anything</div>
          <div className="chat-empty-desc">
            Answers are grounded strictly in the uploaded resume. No hallucination, no generic advice.
          </div>
          <div className="suggestion-chips">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                className="suggestion-chip"
                onClick={() => sendMessage(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="messages-list">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} role={msg.role} content={msg.content} />
          ))}

          {isLoading && (
            <div className="message assistant">
              <div className="message-avatar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
                </svg>
              </div>
              <div className="message-body">
                <div className="message-bubble">
                  <div className="typing-indicator">
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginLeft: 6 }}>Analysing…</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="upload-error" style={{ margin: "0 0 8px" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input */}
      <div className="chat-input-area">
        <div className="chat-input-row">
          <textarea
            ref={textareaRef}
            className="chat-input"
            placeholder={
              hasResume
                ? "Ask about the candidate… (Enter to send)"
                : "Upload a resume first…"
            }
            value={input}
            disabled={!hasResume || isLoading}
            onChange={(e) => {
              setInput(e.target.value);
              resizeTextarea();
            }}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <button
            className="send-btn"
            disabled={!canSend}
            onClick={() => sendMessage(input)}
            title="Send message"
          >
            <SendIcon />
          </button>
        </div>
        <div className="chat-input-hint">
          Grounded strictly in resume content · Powered by Groq (Llama 3.1 8B)
        </div>
      </div>
    </div>
  );
}
