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
      className={`flex w-full py-5 px-4 mb-2 animate-fade-in transition-all ${
        isUser ? "flex-row-reverse" : "flex-row"
      }`}
    >
      {/* Avatar */}
      <div className={`flex-shrink-0 mt-1 ${isUser ? "ml-4" : "mr-4"}`}>
        {isUser ? (
          <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">
            <span className="text-xs font-medium text-gray-600">U</span>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-white border border-black/10 shadow-sm flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-black/5 to-transparent"></div>
            <span className="text-sm font-semibold text-gray-900 tracking-tight relative z-10">N</span>
          </div>
        )}
      </div>

      {/* Message content */}
      <div className={`flex max-w-[85%] ${isUser ? "justify-end" : "justify-start"}`}>
        <div className={`text-[15px] leading-relaxed ${
          isUser 
            ? "bg-gray-100 text-gray-900 px-5 py-3.5 rounded-2xl rounded-tr-sm border border-gray-200/60 shadow-sm" 
            : "text-gray-800 py-1"
        }`}>
          {isUser ? (
            <div className="whitespace-pre-wrap">{content}</div>
          ) : (
            <div className="prose prose-gray prose-p:leading-relaxed prose-pre:bg-gray-50 prose-pre:border prose-pre:border-gray-200 max-w-none">
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
                        className="rounded-md border border-gray-200 my-4 text-xs shadow-sm"
                        {...props}
                      >
                        {String(children).replace(/\n$/, "")}
                      </SyntaxHighlighter>
                    ) : (
                      <code className="bg-gray-100 rounded px-1.5 py-0.5 text-gray-800 font-mono text-xs border border-gray-200" {...props}>
                        {children}
                      </code>
                    );
                  },
                  table({ children, ...props }) {
                    return (
                      <div className="overflow-x-auto my-6 border border-gray-200 rounded-md shadow-sm">
                        <table className="min-w-full divide-y divide-gray-200 text-sm" {...props}>
                          {children}
                        </table>
                      </div>
                    );
                  },
                  th({ children, ...props }) {
                    return <th className="px-4 py-3 bg-gray-50 font-semibold text-left text-gray-900" {...props}>{children}</th>;
                  },
                  td({ children, ...props }) {
                    return <td className="px-4 py-3 bg-transparent border-t border-gray-200 text-gray-800" {...props}>{children}</td>;
                  },
                  h1({ children, ...props }) {
                    return <h1 className="text-2xl font-semibold mt-6 mb-4 text-gray-900 tracking-tight" {...props}>{children}</h1>;
                  },
                  h2({ children, ...props }) {
                    return <h2 className="text-xl font-semibold mt-6 mb-4 text-gray-900 tracking-tight" {...props}>{children}</h2>;
                  },
                  h3({ children, ...props }) {
                    return <h3 className="text-lg font-medium mt-5 mb-3 text-gray-900 tracking-tight" {...props}>{children}</h3>;
                  },
                  p({ children, ...props }) {
                    return <p className="mb-4 last:mb-0" {...props}>{children}</p>;
                  },
                  ul({ children, ...props }) {
                    return <ul className="list-disc pl-6 mb-4 space-y-2 marker:text-gray-400" {...props}>{children}</ul>;
                  },
                  ol({ children, ...props }) {
                    return <ol className="list-decimal pl-6 mb-4 space-y-2 marker:text-gray-400" {...props}>{children}</ol>;
                  },
                  a({ children, ...props }) {
                    return <a className="text-blue-600 hover:text-blue-800 underline underline-offset-2 transition-colors" {...props}>{children}</a>;
                  },
                  blockquote({ children, ...props }) {
                    return <blockquote className="border-l-4 border-gray-200 pl-4 italic text-gray-600 my-4 bg-gray-50 py-2 rounded-r-md" {...props}>{children}</blockquote>;
                  }
                }}
              >
                {content}
              </ReactMarkdown>

              {isStreaming && !content && (
                <span className="inline-flex gap-1 ml-1 items-center h-5">
                  <span className="w-1.5 h-1.5 bg-[#9B9B9B] rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-[#9B9B9B] rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-[#9B9B9B] rounded-full animate-bounce" />
                </span>
              )}
              {isStreaming && content && (
                <span className="inline-block w-2 h-4 bg-[#EBEBEB] animate-pulse ml-1 align-text-bottom" />
              )}
            </div>
          )}
        </div>

        {/* Model badge */}
        {model && !isUser && (
          <div className="mt-3 flex items-center gap-1.5 opacity-50 hover:opacity-100 transition-opacity">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                model.startsWith("groq/") ? "bg-gray-800" : "bg-gray-400"
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
