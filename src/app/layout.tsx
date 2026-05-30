import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Finance DeoSela",
  description: "Personal Finance Dashboard - Deo & Sela",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        <header className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">💰</span>
              <h1 className="text-lg font-bold">Finance DeoSela</h1>
            </div>
            <span className="text-sm text-gray-400">Deo & Sela</span>
          </div>
        </header>
        <main className="flex-1 max-w-6xl mx-auto px-4 py-6 w-full">
          {children}
        </main>
        <footer className="border-t bg-white py-4 text-center text-xs text-gray-400">
          Finance DeoSela — Powered by 🐱 Claw
        </footer>
      </body>
    </html>
  );
}
