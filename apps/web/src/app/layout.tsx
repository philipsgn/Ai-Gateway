import React from "react";
import Link from "next/link";
import { Shield, ShieldAlert, Sparkles, FileText, CheckCircle2, BookOpen } from "lucide-react";
import { auth } from "@/auth";
import "../styles/globals.css";

export const metadata = {
  title: "AI Access Gateway — Cổng Quản Trị & Sử Dụng AI Doanh Nghiệp",
  description: "Cổng truy cập tập trung các công cụ AI dùng chung cho doanh nghiệp: ChatGPT, Claude, Gemini, Cursor.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const isRootAdmin = session?.user?.role === "ROOT_ADMIN";

  return (
    <html lang="vi">
      <body className="bg-cream-100 text-ink-800 min-h-screen flex flex-col antialiased selection:bg-mint-200 selection:text-mint-900">
        <div className="fixed inset-0 radial-glow pointer-events-none z-0" />

        {/* Top Navigation Header */}
        <header className="sticky top-0 z-50 border-b border-cream-300 bg-white/95 backdrop-blur-md transition-all shadow-cream">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            {/* Brand Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-mint-500 to-mint-600 flex items-center justify-center text-white shadow-mint group-hover:scale-105 transition-all">
                <Shield className="w-5 h-5 fill-white/20" />
              </div>
              <div>
                <span className="font-bold text-ink-900 tracking-tight block text-sm sm:text-base leading-tight">
                  AI Access Gateway
                </span>
                <span className="text-[11px] font-medium text-mint-600 flex items-center gap-1">
                  Cổng AI Doanh Nghiệp
                </span>
              </div>
            </Link>

            {/* Navigation links */}
            <div className="flex items-center gap-2 sm:gap-4 text-sm font-medium">
              <nav className="flex items-center gap-1 sm:gap-1.5">
                <Link
                  href="/"
                  className="px-3 py-1.5 rounded-xl text-ink-600 hover:text-ink-900 hover:bg-cream-200 transition-colors text-xs sm:text-sm"
                >
                  Không Gian Làm Việc
                </Link>

                <Link
                  href="/he-thong"
                  className="px-3 py-1.5 rounded-xl text-ink-600 hover:text-ink-900 hover:bg-cream-200 flex items-center gap-1.5 transition-colors text-xs sm:text-sm"
                >
                  <BookOpen className="w-3.5 h-3.5 text-mint-600" />
                  <span>Hệ Thống</span>
                </Link>

                <Link
                  href="/audit"
                  className="px-3 py-1.5 rounded-xl text-ink-600 hover:text-ink-900 hover:bg-cream-200 flex items-center gap-1.5 transition-colors text-xs sm:text-sm"
                >
                  <FileText className="w-3.5 h-3.5 text-ink-500" />
                  <span>Nhật Ký Sử Dụng</span>
                </Link>

                {isRootAdmin && (
                  <Link
                    href="/admin"
                    className="px-3 py-1.5 rounded-xl text-amber-800 hover:text-amber-900 hover:bg-amber-100/80 flex items-center gap-1.5 transition-colors border border-amber-300 bg-amber-50 shadow-sm text-xs sm:text-sm ml-1"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                    <span>Quản Trị</span>
                  </Link>
                )}
              </nav>

              {/* Status Badge */}
              <div className="hidden lg:flex items-center pl-3 border-l border-cream-300">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-mint-50 text-mint-700 border border-mint-200 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-mint-500" />
                  <span>Hệ thống ổn định 99.9%</span>
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 relative z-10">
          {children}
        </main>

        {/* Minimalist Friendly Footer */}
        <footer className="border-t border-cream-300 bg-white/80 py-6 text-xs text-ink-500 relative z-10 mt-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-mint-500" />
              <p className="font-medium text-ink-700">
                AI Access Gateway • Nền tảng chia sẻ & quản trị AI doanh nghiệp
              </p>
            </div>
            <div className="flex items-center gap-4 text-ink-500 text-[11px]">
              <Link href="/he-thong" className="hover:text-ink-800 transition-colors underline-offset-2 hover:underline">
                Hướng dẫn hệ thống
              </Link>
              <span>•</span>
              <span className="text-mint-700 font-medium">Bảo mật đa lớp</span>
              <span>•</span>
              <span>Tối ưu chi phí</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
