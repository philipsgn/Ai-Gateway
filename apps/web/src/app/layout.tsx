import React from "react";
import Link from "next/link";
import { Shield, ShieldAlert, Sparkles, FileText, CheckCircle2, UserCheck, ArrowUpRight } from "lucide-react";
import { auth } from "@/auth";
import "../styles/globals.css";

export const metadata = {
  title: "AI Access Gateway — Enterprise Governance & Access Platform",
  description: "Enterprise AI Access Management Platform featuring Google OAuth 2.0, AES-256-GCM Vault, Concurrency Lease Mutex, and WORM Compliance.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const isRootAdmin = session?.user?.role === "ROOT_ADMIN";
  const userEmail = session?.user?.email;

  return (
    <html lang="vi">
      <body className="bg-cream-100 text-ink-800 min-h-screen flex flex-col antialiased selection:bg-mint-200 selection:text-mint-900">
        <div className="fixed inset-0 radial-glow pointer-events-none z-0" />

        {/* Top Enterprise Header */}
        <header className="sticky top-0 z-50 border-b border-cream-300 bg-white/90 backdrop-blur-md transition-all shadow-cream">
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
                  Enterprise Platform
                </span>
              </div>
            </Link>

            {/* Navigation links & Enterprise SLA indicator */}
            <div className="flex items-center gap-3 sm:gap-5 text-sm font-medium">
              <nav className="flex items-center gap-1 sm:gap-2">
                <Link
                  href="/"
                  className="px-3.5 py-1.5 rounded-xl text-ink-600 hover:text-ink-900 hover:bg-cream-200/80 transition-colors"
                >
                  Không Gian Làm Việc
                </Link>

                {isRootAdmin && (
                  <Link
                    href="/admin"
                    className="px-3.5 py-1.5 rounded-xl text-amber-800 hover:text-amber-900 hover:bg-amber-100/70 flex items-center gap-1.5 transition-colors border border-amber-300/80 bg-amber-50 shadow-sm"
                  >
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    <span>Cổng Quản Trị</span>
                  </Link>
                )}

                <Link
                  href="/audit"
                  className="px-3.5 py-1.5 rounded-xl text-ink-600 hover:text-ink-900 hover:bg-cream-200/80 flex items-center gap-1.5 transition-colors"
                >
                  <FileText className="w-4 h-4 text-ink-500" />
                  <span>Tuân Thủ & WORM</span>
                </Link>
              </nav>

              {/* Enterprise System Status Badge (replaces raw DB driver tags) */}
              <div className="hidden lg:flex items-center pl-4 border-l border-cream-300">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-mint-50 text-mint-700 border border-mint-200 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-mint-500 animate-pulse" />
                  <span>SLA 99.9% Hoạt Động</span>
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 relative z-10">
          {children}
        </main>

        {/* Polished Enterprise Footer */}
        <footer className="border-t border-cream-300 bg-white/80 py-6 text-xs text-ink-500 relative z-10 mt-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-mint-500" />
              <p className="font-medium text-ink-700">
                AI Access Management • Enterprise Production Platform
              </p>
            </div>
            <div className="flex items-center gap-4 text-ink-500 text-[11px]">
              <span className="inline-flex items-center gap-1 text-mint-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-mint-600" />
                ISO 27001 & SOC 2 Ready
              </span>
              <span>•</span>
              <span>WORM Immutable Audit</span>
              <span>•</span>
              <span>Zero-Knowledge Vault</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
