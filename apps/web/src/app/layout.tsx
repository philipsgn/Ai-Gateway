import React from "react";
import Link from "next/link";
import { ShieldCheck, ShieldAlert, Database, Zap, FileText } from "lucide-react";
import { auth } from "@/auth";
import "../styles/globals.css";

export const metadata = {
  title: "Enterprise AI Access Broker — Single Track Architecture",
  description: "Production-ready vertical slice featuring Google OAuth 2.0, PostgreSQL real upsert, and Upstash Redis rate limiting.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const isRootAdmin = session?.user?.role === "ROOT_ADMIN";

  return (
    <html lang="vi" className="dark">
      <body className="bg-[#090d16] text-slate-100 min-h-screen flex flex-col selection:bg-indigo-500 selection:text-white">
        <div className="fixed inset-0 radial-glow pointer-events-none z-0" />
        
        {/* Top Navigation */}
        <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600/30 transition-colors">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="font-semibold text-slate-100 tracking-tight block text-sm sm:text-base leading-none">
                  AI Access Broker
                </span>
                <span className="text-[11px] font-mono text-emerald-400 font-medium">
                  Enterprise Access Control
                </span>
              </div>
            </Link>

            <nav className="flex items-center gap-2 sm:gap-4 text-sm font-medium">
              <Link
                href="/"
                className="px-3 py-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
              >
                Trang chủ
              </Link>
              {isRootAdmin && (
                <Link
                  href="/admin"
                  className="px-3 py-1.5 rounded-md text-amber-300 hover:text-amber-200 hover:bg-amber-500/20 flex items-center gap-1.5 transition-colors border border-amber-500/40 bg-amber-500/10 shadow-sm shadow-amber-500/10"
                >
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  Admin Portal
                </Link>
              )}
              <Link
                href="/audit"
                className="px-3 py-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-800/60 flex items-center gap-1.5 transition-colors"
              >
                <FileText className="w-4 h-4 text-slate-400" />
                Audit Logs
              </Link>
              <div className="hidden md:flex items-center gap-2 pl-3 border-l border-slate-800 text-xs text-slate-400">
                <span className="inline-flex items-center gap-1 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  PostgreSQL
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1 text-cyan-400">
                  <Zap className="w-3 h-3" />
                  Upstash Redis
                </span>
              </div>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 relative z-10">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-900 bg-slate-950/60 py-6 text-center text-xs text-slate-500 relative z-10">
          <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p>Enterprise AI Access Management • Phase 1 (Real Identity & Grants)</p>
            <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
              <span>NextAuth v5</span>
              <span>•</span>
              <span>Drizzle ORM</span>
              <span>•</span>
              <span>Upstash Redis</span>
              <span>•</span>
              <span>Vercel</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
