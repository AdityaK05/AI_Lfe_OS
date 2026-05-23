import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import Sidebar from "@/components/Sidebar";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI Life OS — Nova",
  description: "Next-gen AI operating system powered by your life's data.",
  icons: {
    icon: "/favicon.ico",
  },
  keywords: ["AI", "assistant", "Nova", "LLM", "chat"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${inter.variable} h-full antialiased`}>
        <body className="min-h-full flex flex-col bg-gradient-to-br from-indigo-50 via-white to-purple-50 text-gray-800">
          <div className="flex h-screen overflow-hidden p-3 gap-4">
            <Sidebar />
            <main className="flex-1 overflow-y-auto bg-white/60 backdrop-blur-xl rounded-3xl shadow-sm border border-white/50 relative">
              {children}
            </main>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
