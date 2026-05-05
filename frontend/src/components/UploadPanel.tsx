import { useState, useRef, useCallback } from "react";
import type { DragEvent, ChangeEvent } from "react";
import type { ResumeData } from "../api/client";
import { uploadResume, uploadResumeText } from "../api/client";

interface UploadPanelProps {
  onUploaded: (sessionId: string, resume: ResumeData) => void;
  onReset: () => void;
  resume: ResumeData | null;
}

const UploadSVG = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

const UserSVG = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const WarnSVG = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const TrashSVG = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
);

const ChevronSVG = ({ open }: { open: boolean }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

export default function UploadPanel({ onUploaded, onReset, resume }: UploadPanelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pasteText, setPasteText] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      const allowed = ["application/pdf", "text/plain"];
      const ext = file.name.toLowerCase();
      if (!allowed.includes(file.type) && !ext.endsWith(".txt") && !ext.endsWith(".pdf")) {
        setError("Only PDF and TXT files are supported.");
        return;
      }
      setError(null);
      setIsLoading(true);
      try {
        const result = await uploadResume(file);
        if (file.type === "application/pdf" || ext.endsWith(".pdf")) {
          setPdfUrl(URL.createObjectURL(file));
        } else {
          setPdfUrl(null);
        }
        onUploaded(result.session_id, result.resume as ResumeData);
      } catch (e: unknown) {
        const msg =
          (e as { response?: { data?: { detail?: string } } })?.response?.data
            ?.detail || "Failed to parse resume. Please try again.";
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [onUploaded]
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const handlePasteSubmit = async () => {
    if (!pasteText.trim()) return;
    setError(null);
    setIsLoading(true);
    try {
      const result = await uploadResumeText(pasteText);
      onUploaded(result.session_id, result.resume as ResumeData);
      setPasteText("");
      setPdfUrl(null);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Failed to parse resume text.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="upload-panel">
      <div className="upload-panel-header">
        <span className="panel-title">Resume Input</span>
      </div>

      {!resume ? (
        <>
          {/* Drop Zone */}
          <div
            className={`drop-zone ${isDragging ? "drag-over" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="drop-icon"><UploadSVG /></div>
            <div className="drop-label">Drop resume here or click to browse</div>
            <div className="drop-sublabel">Supports PDF and plain text files</div>
            <div className="drop-types">
              <span className="drop-type-tag">PDF</span>
              <span className="drop-type-tag">TXT</span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,text/plain,application/pdf"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          </div>

          {/* Separator */}
          <div className="upload-separator">
            <span>OR</span>
          </div>

          <div className="paste-area">
            <label className="paste-label">Paste your resume</label>
            <div className="paste-textarea-wrapper">
              <textarea
                className="paste-textarea"
                placeholder="Paste your resume content here..."
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                maxLength={10000}
              />
            </div>
            <div className="paste-footer">
              <span className="paste-helper">You can paste content from PDF or Word (Ctrl + V)</span>
              <span className="paste-counter">{pasteText.length}/10000</span>
            </div>
            <button
              className="paste-submit-btn"
              disabled={!pasteText.trim() || isLoading}
              onClick={handlePasteSubmit}
            >
              {isLoading ? "Parsing…" : "Parse Resume"}
            </button>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="upload-progress">
              <div className="spinner" />
              <span className="upload-progress-text">
                Extracting resume data with AI…
              </span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="upload-error">
              <WarnSVG />
              <span>{error}</span>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Resume Card */}
          <div className="resume-card">
            <div className="resume-card-header">
              <div>
                <div className="resume-name">{resume.name ?? "Unknown Candidate"}</div>
                <div className="resume-meta">
                  {[resume.email, resume.phone].filter(Boolean).join(" · ")}
                </div>
              </div>
              <div className="resume-avatar"><UserSVG /></div>
            </div>

            {resume.summary && (
              <div className="resume-section">
                <div className="resume-section-title">Summary</div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  {resume.summary.length > 160 ? resume.summary.slice(0, 160) + "…" : resume.summary}
                </div>
              </div>
            )}

            {resume.skills.length > 0 && (
              <div className="resume-section">
                <div className="resume-section-title">Skills ({resume.skills.length})</div>
                <div className="skills-grid">
                  {resume.skills.map((s, i) => (
                    <span key={i} className="skill-chip">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {resume.experience.length > 0 && (
              <div className="resume-section">
                <div className="resume-section-title">Experience</div>
                {resume.experience.slice(0, 3).map((exp, i) => (
                  <div key={i} className="exp-item">
                    <div className="exp-title">{exp.title}</div>
                    <div className="exp-company">{exp.company}</div>
                    {exp.duration && <div className="exp-duration">{exp.duration}</div>}
                  </div>
                ))}
                {resume.experience.length > 3 && (
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 4 }}>
                    +{resume.experience.length - 3} more positions
                  </div>
                )}
              </div>
            )}

            {resume.education.length > 0 && (
              <div className="resume-section">
                <div className="resume-section-title">Education</div>
                {resume.education.map((edu, i) => (
                  <div key={i} className="edu-item">
                    {edu.degree} — {edu.institution}{" "}
                    {edu.year && <span>({edu.year})</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {pdfUrl && (
            <button className="view-pdf-btn" onClick={() => window.open(pdfUrl, "_blank")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
              </svg>
              View Uploaded PDF
            </button>
          )}

          <button className="reset-btn" onClick={() => { setPdfUrl(null); onReset(); }}>
            <TrashSVG />
            Upload different resume
          </button>
        </>
      )}
    </div>
  );
}
