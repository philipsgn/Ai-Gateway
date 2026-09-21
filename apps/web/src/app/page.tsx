import React from "react";
import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, signIn, signOut } from "@/auth";
import { db, employees } from "@/db";
import { eq } from "drizzle-orm";
import { checkLoginRateLimit } from "@/lib/redis";
import {
  ShieldCheck,
  Database,
  Lock,
  ArrowRight,
  LogOut,
  CheckCircle,
  FileText,
  Activity,
  User,
  KeyRound,
  Calendar,
  AlertCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const session = await auth();

  // Server Action: Handles login with Upstash Redis Rate-Limiting
  async function handleLogin() {
    "use server";
    const headerList = headers();
    const forwarded = headerList.get("x-forwarded-for");
    const clientIp = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";

    const rateLimit = await checkLoginRateLimit(clientIp);
    if (!rateLimit.success) {
      redirect("/?error=rate_limited");
    }

    await signIn("google", { redirectTo: "/" });
  }

  // Server Action: Handles clean sign-out
  async function handleLogout() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  // If authenticated, fetch employee data directly from PostgreSQL (NOT from session)
  let dbEmployee = null;
  let dbQueryError: string | null = null;

  if (session?.user?.id) {
    try {
      const records = await db
        .select()
        .from(employees)
        .where(eq(employees.id, session.user.id))
        .limit(1);

      if (records.length > 0) {
        dbEmployee = records[0];
      }
    } catch (err: any) {
      console.error("[PostgreSQL] Error querying employee record:", err);
      dbQueryError = err?.message || "Failed to query database";
    }
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Error alert if rate-limited or error param */}
      {searchParams.error === "rate_limited" && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold">Quá giới hạn đăng nhập (Rate Limit Exceeded)</p>
            <p className="text-amber-300/80 text-xs">
              Upstash Redis đã chặn yêu cầu vì có hơn 10 lần thử trong 60 giây. Vui lòng đợi một lát.
            </p>
          </div>
        </div>
      )}

      {!session ? (
        /* ==================== STATE: UNAUTHENTICATED ==================== */
        <div className="space-y-6">
          <div className="glass-panel p-8 sm:p-12 rounded-2xl relative overflow-hidden border border-slate-800">
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Phase 17 • Track A (MVP Real Auth Slice)
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                Enterprise AI Access Broker
              </h1>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Vertical slice xác thực thật 100%: Đăng nhập bằng Google OAuth 2.0 thật, lưu trữ và upsert định danh vào PostgreSQL thật, kiểm toán vào bảng AuditLog, bảo vệ tần suất bằng Upstash Redis thật.
              </p>

              {/* Login Form */}
              <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <form action={handleLogin}>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl text-sm font-semibold text-slate-900 bg-white hover:bg-slate-100 hover:shadow-lg hover:shadow-indigo-500/10 transition-all active:scale-[0.98] border border-slate-200"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Đăng nhập bằng Google</span>
                    <ArrowRight className="w-4 h-4 text-slate-500" />
                  </button>
                </form>

                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Rate-limited by Upstash Redis (10 req/min)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Architecture Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-panel p-5 rounded-xl border border-slate-800/80 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <KeyRound className="w-4 h-4" />
              </div>
              <h2 className="font-semibold text-sm text-slate-200">Auth.js v5 (Google OAuth)</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Sử dụng Google OAuth 2.0 Web Client thật. Session ký bằng JWS/JWE, an toàn chống giả mạo token.
              </p>
            </div>

            <div className="glass-panel p-5 rounded-xl border border-slate-800/80 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Database className="w-4 h-4" />
              </div>
              <h2 className="font-semibold text-sm text-slate-200">PostgreSQL Upsert Thật</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tự động upsert theo <code>google_sub</code> vào bảng <code>employees</code>. Không tạo trùng bản ghi khi đăng nhập lại.
              </p>
            </div>

            <div className="glass-panel p-5 rounded-xl border border-slate-800/80 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
              <h2 className="font-semibold text-sm text-slate-200">Upstash Redis Protection</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Bảo vệ endpoint đăng nhập bằng thuật toán Sliding Window qua kết nối HTTP REST serverless.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* ==================== STATE: AUTHENTICATED ==================== */
        <div className="space-y-6">
          {/* Header Card */}
          <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                {dbEmployee?.avatarUrl ? (
                  <img
                    src={dbEmployee.avatarUrl}
                    alt={dbEmployee.name || "Avatar"}
                    className="w-16 h-16 rounded-full ring-2 ring-indigo-500/30 object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-indigo-600/20 ring-2 ring-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <User className="w-8 h-8" />
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-white tracking-tight">
                      {dbEmployee?.name || "Người dùng"}
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {dbEmployee?.role || "EMPLOYEE"}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 font-mono mt-0.5">
                    {dbEmployee?.email}
                  </p>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Dữ liệu được truy vấn THẬT từ PostgreSQL (Drizzle ORM)</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Link
                  href="/audit"
                  className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  Xem Audit Logs
                </Link>

                <form action={handleLogout} className="flex-1 sm:flex-initial">
                  <button
                    type="submit"
                    className="w-full px-4 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Đăng xuất
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Database Identity Details */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-400" />
              Chi tiết bản ghi PostgreSQL (Table: <code>employees</code>)
            </h2>

            {dbQueryError ? (
              <div className="p-3 rounded-lg bg-rose-500/10 text-rose-300 text-xs border border-rose-500/30">
                Lỗi truy vấn DB: {dbQueryError}
              </div>
            ) : dbEmployee ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800/80 space-y-1">
                  <span className="text-slate-500 block text-[11px]">POSTGRES ID (UUID)</span>
                  <span className="text-slate-200 select-all">{dbEmployee.id}</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800/80 space-y-1">
                  <span className="text-slate-500 block text-[11px]">GOOGLE SUBJECT ID (google_sub)</span>
                  <span className="text-slate-200 select-all">{dbEmployee.googleSub}</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800/80 space-y-1">
                  <span className="text-slate-500 block text-[11px]">EMAIL</span>
                  <span className="text-slate-200">{dbEmployee.email}</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800/80 space-y-1">
                  <span className="text-slate-500 block text-[11px]">CREATED AT</span>
                  <span className="text-slate-200">
                    {dbEmployee.createdAt
                      ? new Date(dbEmployee.createdAt).toLocaleString("vi-VN")
                      : "N/A"}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Đang tải thông tin bản ghi...</p>
            )}

            <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Xác thực thành công: Bản ghi trên được đọc trực tiếp từ PostgreSQL thông qua truy vấn <code>SELECT ... WHERE id = ...</code>.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
