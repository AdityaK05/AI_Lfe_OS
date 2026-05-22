"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface ChatMessageProps {
  role: "user" | "assistant" | "system";
  content: string;
  model?: string;
  isStreaming?: boolean;
}

export default function ChatMessage({
  role,
  content,
  model,
  isStreaming,
}: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div
      className={`flex w-full py-6 px-4 mb-4 rounded-2xl animate-fade-in transition-all ${
        isUser ? "bg-white/[0.03] border border-white/5" : "glass-panel"
      }`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 mr-5 mt-1">
        {isUser ? (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <span className="text-xs font-bold text-white">U</span>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 animate-gradient">
            <span className="text-sm font-bold text-white tracking-tight">J</span>
          </div>
        )}
      </div>

      {/* Message content */}
      <div className="flex-1 overflow-hidden">
        <div className="text-[15px] leading-relaxed text-gray-200">
          {isUser ? (
            <div className="whitespace-pre-wrap">{content}</div>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || "");
                    return !inline && match ? (
                      <SyntaxHighlighter
                        style={vscDarkPlus as any}
                        language={match[1]}
                        PreTag="div"
                        className="rounded-lg border border-white/10 my-4 text-xs"
                        {...props}
                      >
                        {String(children).replace(/\n$/, "")}
                      </SyntaxHighlighter>
                    ) : (
                      <code className="bg-white/10 rounded px-1.5 py-0.5 text-cyan-300 font-mono text-xs" {...props}>
                        {children}
                      </code>
                    );
                  },
                  table({ children, ...props }) {
                    return (
                      <div className="overflow-x-auto my-6 border border-white/10 rounded-xl">
                        <table className="min-w-full divide-y divide-white/10 text-sm" {...props}>
                          {children}
                        </table>
                      </div>
                    );
                  },
                  th({ children, ...props }) {
                    return <th className="px-4 py-3 bg-white/5 font-semibold text-left text-gray-200" {...props}>{children}</th>;
                  },
                  td({ children, ...props }) {
                    return <td className="px-4 py-3 bg-transparent border-t border-white/5" {...props}>{children}</td>;
                  },
                  h1({ children, ...props }) {
                    return <h1 className="text-2xl font-bold mt-6 mb-4 text-white" {...props}>{children}</h1>;
                  },
                  h2({ children, ...props }) {
                    return <h2 className="text-xl font-bold mt-6 mb-4 text-white" {...props}>{children}</h2>;
                  },
                  h3({ children, ...props }) {
                    return <h3 className="text-lg font-bold mt-5 mb-3 text-white" {...props}>{children}</h3>;
                  },
                  p({ children, ...props }) {
                    return <p className="mb-4 last:mb-0" {...props}>{children}</p>;
                  },
                  ul({ children, ...props }) {
                    return <ul className="list-disc pl-6 mb-4 space-y-2 marker:text-cyan-500" {...props}>{children}</ul>;
                  },
                  ol({ children, ...props }) {
                    return <ol className="list-decimal pl-6 mb-4 space-y-2 marker:text-cyan-500" {...props}>{children}</ol>;
                  },
                  a({ children, ...props }) {
                    return <a className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2" {...props}>{children}</a>;
                  },
                  blockquote({ children, ...props }) {
                    return <blockquote className="border-l-2 border-cyan-500 pl-4 italic text-gray-400 my-4 bg-white/5 py-2 rounded-r-lg" {...props}>{children}</blockquote>;
                  }
                }}
              >
                {content}
              </ReactMarkdown>

              {isStreaming && !content && (
                <span className="inline-flex gap-1 ml-1 items-center h-5">
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" />
                </span>
              )}
              {isStreaming && content && (
                <span className="inline-block w-2 h-4 bg-cyan-400 animate-pulse ml-1 align-text-bottom" />
              )}
            </div>
          )}
        </div>

        {/* Model badge */}
        {model && !isUser && (
          <div className="mt-3 flex items-center gap-1.5 opacity-50 hover:opacity-100 transition-opacity">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                model.startsWith("groq/") ? "bg-emerald-400" : "bg-amber-400"
              }`}
            />
            <span className="text-[10px] text-gray-500 font-mono tracking-wide uppercase">
              {model}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
