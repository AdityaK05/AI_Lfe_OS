import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI Life OS — JARVIS",
  description:
    "Your personal AI operating system. Powered by streaming LLMs with smart cloud/local routing.",
  keywords: ["AI", "assistant", "JARVIS", "LLM", "chat"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${inter.variable} h-full antialiased dark`}>
        <body className="min-h-full flex flex-col bg-[#0a0a0f]">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
