"use client";



import React, { useState, useRef, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const ACCEPTED = ".pdf,.txt,.md,.markdown";

interface UploadResult {
  doc_id: string;
  title: string;
  chunks_added: number;
  total_chars: number;
}

interface DocumentUploadProps {
  userId?: string;
  onUploadComplete?: (result: UploadResult) => void;
}

export default function DocumentUpload({
  userId = "default",
  onUploadComplete,
}: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { getToken } = useAuth();

  const resetState = () => {
    setResult(null);
    setError(null);
    setProgress(0);
  };

  const uploadFile = useCallback(
    async (file: File) => {
      resetState();
      setIsUploading(true);
      setProgress(10);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("user_id", userId);

        
        setProgress(30);

        const token = await getToken();
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch(`${API_BASE}/documents/upload`, {
          method: "POST",
          headers,
          body: formData,
        });

        setProgress(70);

        if (!res.ok) {
          const err = await res.json().catch(() => ({ detail: "Upload failed" }));
          throw new Error(err.detail || `HTTP ${res.status}`);
        }

        setProgress(90);
        const data: UploadResult = await res.json();
        setResult(data);
        setProgress(100);
        onUploadComplete?.(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setIsUploading(false);
      }
    },
    [userId, onUploadComplete, getToken]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) uploadFile(file);
    },
    [uploadFile]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = ""; // Reset so same file can be re-selected
  };

  return (
    <div className="w-full" id="document-upload">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`relative cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all duration-300 ${
          isDragging
            ? "border-cyan-400 bg-cyan-400/5 shadow-lg shadow-cyan-500/10"
            : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
        } ${isUploading ? "pointer-events-none opacity-70" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED}
          onChange={handleFileSelect}
          className="hidden"
          id="file-input"
        />

        {}
        <div className="mx-auto mb-3 w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 flex items-center justify-center">
          <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
        </div>

        <p className="text-sm text-gray-400 mb-1">
          {isDragging ? "Drop file here" : "Drop a file or click to upload"}
        </p>
        <p className="text-[10px] text-gray-600">PDF, TXT, Markdown — max 10MB</p>

        {}
        {isUploading && (
          <div className="mt-4 w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {}
      {result && (
        <div className="mt-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 animate-fade-in">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium text-emerald-300">{result.title}</span>
          </div>
          <p className="text-[10px] text-gray-500">
            {result.chunks_added} chunks · {(result.total_chars / 1000).toFixed(1)}k chars
          </p>
        </div>
      )}

      {}
      {error && (
        <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 animate-fade-in">
          <p className="text-sm text-red-400">⚠️ {error}</p>
        </div>
      )}
    </div>
  );
}
