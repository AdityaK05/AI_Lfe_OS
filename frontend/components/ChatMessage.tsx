"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Triangle } from "lucide-react";

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
      className={`flex w-full py-5 px-4 mb-2 animate-fade-in-up transition-smooth ${
        isUser ? "flex-row-reverse" : "flex-row"
      }`}
    >
      {/* Avatar */}
      <div className={`flex-shrink-0 mt-1 ${isUser ? "ml-4" : "mr-4"}`}>
        {isUser ? (
          <div className="w-8 h-8 rounded-full bg-foreground/10 border border-border flex items-center justify-center">
            <span className="text-xs font-medium text-foreground">U</span>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-foreground text-background shadow-md flex items-center justify-center relative overflow-hidden">
            <Triangle className="w-3.5 h-3.5 fill-current" strokeWidth={1} />
          </div>
        )}
      </div>

      {/* Bubble */}
      <div className={`flex max-w-[85%] ${isUser ? "justify-end" : "justify-start"}`}>
        <div className={`text-[15px] leading-relaxed ${
          isUser 
            ? "bg-foreground/5 text-foreground px-5 py-3.5 rounded-2xl rounded-tr-sm border border-border shadow-sm" 
            : "text-foreground py-1"
        }`}>
          {isUser ? (
            <div className="whitespace-pre-wrap">{content}</div>
          ) : (
            <div className="prose dark:prose-invert prose-p:leading-relaxed prose-pre:bg-foreground/5 prose-pre:border prose-pre:border-border max-w-none">
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
                        className="rounded-xl border border-border my-4 text-xs shadow-sm"
                        {...props}
                      >
                        {String(children).replace(/\n$/, "")}
                      </SyntaxHighlighter>
                    ) : (
                      <code className="bg-foreground/10 text-foreground rounded px-1.5 py-0.5 font-mono text-xs border border-border" {...props}>
                        {children}
                      </code>
                    );
                  },
                  table({ children, ...props }) {
                    return (
                      <div className="overflow-x-auto my-6 border border-border rounded-xl shadow-sm">
                        <table className="min-w-full divide-y divide-border text-sm" {...props}>
                          {children}
                        </table>
                      </div>
                    );
                  },
                  th({ children, ...props }) {
                    return <th className="px-4 py-3 bg-foreground/5 font-semibold text-left text-foreground" {...props}>{children}</th>;
                  },
                  td({ children, ...props }) {
                    return <td className="px-4 py-3 bg-transparent border-t border-border text-text-muted" {...props}>{children}</td>;
                  },
                  h1({ children, ...props }) {
                    return <h1 className="text-2xl font-semibold mt-6 mb-4 text-foreground tracking-tight" {...props}>{children}</h1>;
                  },
                  h2({ children, ...props }) {
                    return <h2 className="text-xl font-medium mt-6 mb-4 text-foreground tracking-tight" {...props}>{children}</h2>;
                  },
                  h3({ children, ...props }) {
                    return <h3 className="text-lg font-medium mt-5 mb-3 text-foreground tracking-tight" {...props}>{children}</h3>;
                  },
                  p({ children, ...props }) {
                    return <p className="mb-4 last:mb-0" {...props}>{children}</p>;
                  },
                  ul({ children, ...props }) {
                    return <ul className="list-disc pl-6 mb-4 space-y-2 marker:text-text-muted" {...props}>{children}</ul>;
                  },
                  ol({ children, ...props }) {
                    return <ol className="list-decimal pl-6 mb-4 space-y-2 marker:text-text-muted" {...props}>{children}</ol>;
                  },
                  a({ children, ...props }) {
                    return <a className="text-blue-500 hover:text-blue-600 underline underline-offset-4 transition-colors" {...props}>{children}</a>;
                  },
                  blockquote({ children, ...props }) {
                    return <blockquote className="border-l-4 border-foreground/20 pl-4 italic text-text-muted my-4 bg-foreground/5 py-3 rounded-r-xl" {...props}>{children}</blockquote>;
                  }
                }}
              >
                {content}
              </ReactMarkdown>

              {isStreaming && !content && (
                <span className="inline-flex gap-1 ml-1 items-center h-5">
                  <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce" />
                </span>
              )}
              {isStreaming && content && (
                <span className="inline-block w-2 h-4 bg-foreground/30 animate-pulse ml-1 align-text-bottom" />
              )}
            </div>
          )}
        </div>

        {/* Footer info (model name) */}
        {model && !isUser && (
          <div className="mt-3 flex items-center gap-1.5 opacity-50 hover:opacity-100 transition-opacity">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                model.startsWith("groq/") ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
            <span className="text-[10px] text-text-muted font-mono tracking-wide uppercase">
              {model}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
