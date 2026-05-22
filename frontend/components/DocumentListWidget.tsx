"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { fetchDocuments, DocumentInfo } from "@/lib/api";
import DocumentUpload from "./DocumentUpload";

export default function DocumentListWidget() {
  const [docs, setDocs] = useState<DocumentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const { getToken, userId, isLoaded, isSignedIn } = useAuth();

  const loadDocs = React.useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;
    try {
      setLoading(true);
      const token = await getToken();
      const data = await fetchDocuments(userId || "default", token);
      setDocs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, getToken, userId]);

  useEffect(() => {
    loadDocs();
  }, [loadDocs]);

  if (!isLoaded || !isSignedIn) return null;

  return (
    <div className="w-full glass-panel rounded-2xl p-4 transition-all flex flex-col group hover:border-white/10 hover:shadow-[0_0_20px_rgba(52,211,153,0.05)]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-emerald-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-200">Knowledge Base</h3>
        </div>
        <button 
          onClick={() => setIsUploading(!isUploading)}
          className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-1 rounded-md transition-colors"
        >
          {isUploading ? "Cancel" : "+ Add"}
        </button>
      </div>

      {isUploading && (
        <div className="mb-4 animate-fade-in">
          <DocumentUpload 
            userId={userId || "default"} 
            onUploadComplete={() => {
              setIsUploading(false);
              loadDocs();
            }}
          />
        </div>
      )}

      {loading ? (
        <div className="animate-pulse flex flex-col gap-3">
          <div className="h-8 bg-white/5 rounded-lg w-full"></div>
          <div className="h-8 bg-white/5 rounded-lg w-full"></div>
        </div>
      ) : docs.length === 0 && !isUploading ? (
        <p className="text-xs text-gray-500 text-center py-4">No documents uploaded.</p>
      ) : (
        <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
          {docs.map((doc, idx) => (
            <div key={doc.doc_id || idx} className="flex items-center justify-between p-2.5 rounded-lg glass-panel-hover border border-transparent transition-colors group">
              <div className="flex items-center gap-3 overflow-hidden">
                <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-xs font-medium text-gray-200 truncate">{doc.title}</span>
                  <span className="text-[10px] text-gray-500">{doc.chunks} chunks</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
