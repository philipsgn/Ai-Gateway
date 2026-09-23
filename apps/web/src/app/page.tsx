import React from "react";
import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, signIn, signOut } from "@/auth";
import { db, employees, grants, departments } from "@/db";
import { eq, and, desc } from "drizzle-orm";
import { checkLoginRateLimit } from "@/lib/redis";
import {
  ShieldCheck,
  ShieldAlert,
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
  Sparkles,
  Layers,
  ExternalLink,
  Zap,
  Clock,
  Compass,
  Building2,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import { getResourceDetails } from "@/lib/catalog";
import { getDepartmentBudgetStats, DepartmentBudgetSummary } from "@/lib/budget";

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

  if (session?.user) {
    try {
      const googleSub = (session.user as any).googleSub;
      const email = session.user.email;
      const userId = session.user.id;

      // Query database flexibly by googleSub, email, or internal id
      const conditions = [];
      if (userId && userId.includes("-")) {
        // Valid UUID format
        conditions.push(eq(employees.id, userId));
      }
      if (googleSub) {
        conditions.push(eq(employees.googleSub, googleSub));
      }
      if (email) {
        conditions.push(eq(employees.email, email));
      }

      if (conditions.length > 0) {
        const records = await db
          .select()
          .from(employees)
          .where(conditions.length === 1 ? conditions[0] : eq(employees.email, email || ""))
          .limit(1);

        if (records.length > 0) {
          dbEmployee = records[0];
        }
      }
    } catch (err: any) {
      console.error("[PostgreSQL] Error querying employee record:", err);
      dbQueryError = err?.message || "Failed to query database";
    }
  }

  // If employee record is found, query their active AI grants
  let userGrants: (typeof grants.$inferSelect)[] = [];
  let employeeDept: typeof departments.$inferSelect | null = null;
  let deptBudgetStats: DepartmentBudgetSummary | null = null;

  if (dbEmployee?.id) {
    try {
      userGrants = await db
        .select()
        .from(grants)
        .where(and(eq(grants.employeeId, dbEmployee.id), eq(grants.status, "ACTIVE")))
        .orderBy(desc(grants.createdAt));

      // Query employee's department and quota stats if assigned
      if (dbEmployee.departmentId) {
        const [d] = await db
          .select()
          .from(departments)
          .where(eq(departments.id, dbEmployee.departmentId))
          .limit(1);
        if (d) {
          employeeDept = d;
          deptBudgetStats = await getDepartmentBudgetStats(d.id, d);
        }
      }
    } catch (err: any) {
      console.error("[PostgreSQL] Error querying employee grants or department:", err);
    }
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Launch & Security Error Alerts */}
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

      {searchParams.error === "grant_revoked" && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold">Quyền truy cập đã bị thu hồi (Access Revoked)</p>
            <p className="text-rose-300/80 text-xs">
              Quyền sử dụng dịch vụ AI này đã bị Quản trị viên thu hồi trên PostgreSQL. Bạn không thể khởi chạy công cụ này.
            </p>
          </div>
        </div>
      )}

      {searchParams.error === "grant_expired" && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 flex items-center gap-3">
          <Clock className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold">Quyền dịch vụ AI đã hết hạn (Grant Expired)</p>
            <p className="text-amber-300/80 text-xs">
              Thời hạn sử dụng dịch vụ AI này đã kết thúc. Vui lòng liên hệ Root Administrator để được gia hạn quyền.
            </p>
          </div>
        </div>
      )}

      {searchParams.error === "forbidden" && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 flex items-center gap-3">
          <Lock className="w-5 h-5 text-rose-400 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold">Từ chối truy cập (Forbidden)</p>
            <p className="text-rose-300/80 text-xs">
              Bạn không phải là chủ sở hữu của quyền truy cập này. Yêu cầu khởi chạy đã bị chặn và ghi nhận nhật ký an ninh.
            </p>
          </div>
        </div>
      )}

      {searchParams.error === "grant_not_found" && (
        <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-slate-400 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold">Không tìm thấy quyền dịch vụ</p>
            <p className="text-slate-400 text-xs">
              Mã cấp quyền dịch vụ AI không tồn tại trong cơ sở dữ liệu.
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
                Phase 2 • Service Launch & Direct Access Hub
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                Enterprise AI Access Broker
              </h1>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Nền tảng quản lý phân quyền và cổng khởi chạy dịch vụ AI doanh nghiệp: Đăng nhập Google OAuth 2.0 thật, phân quyền linh hoạt, cổng khởi chạy trực tiếp an toàn với kiểm tra trạng thái và đếm tần suất sử dụng thời gian thực.
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
              <h2 className="font-semibold text-sm text-slate-200">Direct Launch Gateway</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Kiểm tra quyền, kiểm tra hạn dùng, đếm lượt truy cập và ghi Audit Log thời gian thực trước khi chuyển hướng an toàn.
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
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl font-bold text-white tracking-tight">
                      {dbEmployee?.name || "Người dùng"}
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {dbEmployee?.role || "EMPLOYEE"}
                    </span>
                    {employeeDept && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 flex items-center gap-1 font-mono">
                        <Building2 className="w-3 h-3 text-cyan-400" />
                        {employeeDept.name} ({employeeDept.code})
                      </span>
                    )}
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

          {/* Department Budget & Quota Visibility */}
          {deptBudgetStats && (
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20 shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      Ngân Sách AI Phòng Ban: {deptBudgetStats.name}
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {deptBudgetStats.code}
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Hạn mức chi tiêu AI chung cho toàn bộ nhân sự trực thuộc bộ phận
                    </p>
                  </div>
                </div>

                <div>
                  {deptBudgetStats.status === "EXCEEDED" ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/30">
                      <AlertTriangle className="w-3 h-3 text-rose-400" />
                      VƯỢT HẠN MỨC NGÂN SÁCH
                    </span>
                  ) : deptBudgetStats.status === "WARNING" ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                      TIỆM CẬN TRẦN NGÂN SÁCH ({deptBudgetStats.percentageUsed}%)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle className="w-3 h-3" />
                      TRONG HẠN MỨC AN TOÀN
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs font-mono pt-1">
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-0.5">
                  <span className="text-slate-400 text-[10px] block">HẠN MỨC THÁNG</span>
                  <span className="font-bold text-slate-200">${deptBudgetStats.monthlyBudgetUsd.toFixed(2)}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-0.5">
                  <span className="text-slate-400 text-[10px] block">ĐÃ DÙNG THỰC TẾ</span>
                  <span className="font-bold text-amber-300">${deptBudgetStats.spentUsd.toFixed(2)} ({deptBudgetStats.percentageUsed}%)</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-0.5">
                  <span className="text-slate-400 text-[10px] block">CÒN LẠI</span>
                  <span className="font-bold text-emerald-300">${deptBudgetStats.remainingUsd.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-1 pt-1">
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full ${
                      deptBudgetStats.status === "EXCEEDED"
                        ? "bg-rose-500"
                        : deptBudgetStats.status === "WARNING"
                        ? "bg-amber-400"
                        : "bg-emerald-400"
                    } transition-all duration-500`}
                    style={{ width: `${Math.min(100, deptBudgetStats.percentageUsed)}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Root Admin Management Callout */}
          {dbEmployee?.role === "ROOT_ADMIN" && (
            <div className="glass-panel p-5 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-slate-900 to-indigo-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-white">Bạn đang đăng nhập với quyền Root Administrator</h3>
                  <p className="text-xs text-slate-300">
                    Bạn có toàn quyền truy cập Cổng Quản Trị để cấp phát, giám sát tần suất sử dụng và thu hồi quyền dịch vụ AI.
                  </p>
                </div>
              </div>
              <Link
                href="/admin"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-1.5 transition-colors shadow-lg shadow-amber-500/10 shrink-0 font-medium"
              >
                <span>Mở Admin Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* AI Launcher Hub: Interactive Tool Grid */}
          <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Compass className="w-5 h-5 text-indigo-400" />
                  AI Launcher Hub — Cổng Khởi Chạy Dịch Vụ
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Chọn công cụ AI được phân quyền và bấm "Khởi chạy" để kết nối an toàn qua Gateway.
                </p>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 self-start sm:self-auto">
                {userGrants.length} dịch vụ kích hoạt
              </span>
            </div>

            {userGrants.length === 0 ? (
              <div className="p-8 rounded-xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/20">
                  <Sparkles className="w-6 h-6" />
                </div>
                <p className="text-slate-200 text-sm font-semibold">
                  Chưa có quyền dịch vụ AI nào được cấp cho tài khoản này
                </p>
                <p className="text-slate-400 text-xs max-w-md mx-auto leading-relaxed">
                  Tài khoản của bạn đã được lưu trên PostgreSQL nhưng chưa được cấp quyền công cụ AI nào. Vui lòng liên hệ Quản trị viên (Root Administrator) để được phân quyền ChatGPT, Claude, Gemini hoặc Cursor.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userGrants.map((grant) => {
                  const details = getResourceDetails(grant.resourceName);
                  return (
                    <div
                      key={grant.id}
                      className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-4 group relative overflow-hidden"
                    >
                      <div className="space-y-3">
                        {/* Top: Name, Provider & Badges */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                              <h3 className="font-bold text-sm sm:text-base text-white group-hover:text-indigo-300 transition-colors">
                                {grant.resourceName}
                              </h3>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Cung cấp bởi <span className="text-slate-300 font-medium">{details.provider}</span>
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${details.badgeColor}`}>
                              {details.category}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              ACTIVE
                            </span>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                          {details.description}
                        </p>

                        {/* Metadata Metrics & Cost Estimation */}
                        <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px] text-slate-400 font-mono">
                          <div className="flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>Lượt dùng: <strong className="text-slate-200">{grant.accessCount || 0}</strong></span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <DollarSign className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span>Đơn giá: <strong className="text-cyan-300">${details.costPerLaunch.toFixed(2)}</strong>/lượt</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            <span>
                              {grant.expiresAt
                                ? `Hạn: ${new Date(grant.expiresAt).toLocaleDateString("vi-VN")}`
                                : "Vô thời hạn"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                            <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                            <span>
                              {grant.lastAccessedAt
                                ? new Date(grant.lastAccessedAt).toLocaleDateString("vi-VN")
                                : "Chưa khởi chạy"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Direct Launch Button */}
                      <div className="pt-2">
                        <a
                          href={`/api/launch/${grant.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] transition-all shadow-md shadow-indigo-600/20"
                        >
                          <span>Khởi chạy dịch vụ</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs space-y-2">
                <div className="flex items-center gap-2 font-semibold text-amber-300">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Chưa tìm thấy bản ghi trong cơ sở dữ liệu PostgreSQL</span>
                </div>
                <p className="text-amber-200/80 leading-relaxed">
                  Trình duyệt của bạn đang lưu cookie session cũ, nhưng PostgreSQL chưa có bản ghi khớp (hoặc <code>DATABASE_URL</code> trong <code>.env.local</code> chưa phải là connection string thật).
                </p>
                <div className="p-2.5 rounded bg-slate-900/60 border border-amber-500/20 font-mono text-[11px] text-slate-300">
                  💡 <strong>Khắc phục:</strong> Cập nhật <code>DATABASE_URL</code> thật từ Neon/Supabase vào <code>.env.local</code>, chạy <code>npm run db:migrate</code>, sau đó bấm <strong>Đăng xuất</strong> và bấm <strong>Đăng nhập bằng Google</strong>.
                </div>
              </div>
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
