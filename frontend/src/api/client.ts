import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 120000,
});

export interface ResumeData {
  name: string | null;
  email: string | null;
  phone: string | null;
  skills: string[];
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    description: string;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
  projects?: Array<{
    name: string;
    description: string;
    date?: string | null;
  }>;
  achievements?: string[];
  certifications?: string[];
  languages?: string[];
  links?: string[];
  location?: string | null;
  summary: string | null;
}

export interface AgentResponse {
  answer: string;
  confidence: number;
  source: "resume" | "inference" | "tool";
  missing_data: string[];
}

export interface UploadResult {
  session_id: string;
  resume: ResumeData;
  message: string;
}

export interface ChatResult {
  response: AgentResponse;
  session_id: string;
}

export async function uploadResume(
  file: File,
  sessionId?: string
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);
  if (sessionId) formData.append("session_id", sessionId);

  const res = await api.post<UploadResult>("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function uploadResumeText(
  text: string,
  sessionId?: string
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("text", text);
  if (sessionId) formData.append("session_id", sessionId);

  const res = await api.post<UploadResult>("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function sendChat(
  sessionId: string,
  message: string
): Promise<ChatResult> {
  const res = await api.post<ChatResult>("/chat", {
    session_id: sessionId,
    message,
  });
  return res.data;
}

export async function clearSession(sessionId: string): Promise<void> {
  await api.delete(`/session/${sessionId}`);
}
