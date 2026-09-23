import React from "react";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db, employees, grants, auditLogs } from "@/db";
import { desc, eq } from "drizzle-orm";
import {
  ShieldAlert,
  ShieldCheck,
  KeyRound,
  UserCheck,
  UserX,
  AlertTriangle,
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Users,
  Layers,
  ArrowLeft,
  Sparkles,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPortalPage() {
  const session = await auth();
  const isRootAdmin = session?.user?.role === "ROOT_ADMIN";

  // 1. Role Guard: Non-root users or unauthenticated users get 403 Forbidden view
  if (!session || !isRootAdmin) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 rounded-2xl glass-panel border border-rose-500/30 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            403 — Quyền Truy Cập Bị Từ Chối (Access Denied)
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            Khu vực này chỉ dành riêng cho <strong>Root Administrator</strong> được cấu hình trong biến môi trường{" "}
            <code className="text-rose-300 font-mono text-xs bg-slate-900 px-1.5 py-0.5 rounded">ROOT_ADMIN_EMAIL</code>.
          </p>
          <p className="text-slate-400 text-xs">
            Tài khoản hiện tại của bạn:{" "}
            <span className="font-mono text-slate-200">
              {session?.user?.email || "Chưa đăng nhập"}
            </span>{" "}
            (Vai trò:{" "}
            <span className="font-mono text-amber-400">
              {session?.user?.role || "GUEST"}
            </span>
            )
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors border border-slate-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay về Trang chủ
          </Link>
        </div>
      </div>
    );
  }

  // Server Action: Issue New AI Grant
  async function handleCreateGrant(formData: FormData) {
    "use server";
    const currentSession = await auth();
    if (currentSession?.user?.role !== "ROOT_ADMIN") {
      throw new Error("Unauthorized: Only Root Admin can issue grants");
    }

    const employeeId = formData.get("employeeId") as string;
    const resourceName = formData.get("resourceName") as string;
    const expiresDaysStr = formData.get("expiresDays") as string;

    if (!employeeId || !resourceName) {
      return;
    }

    const expiresDays = expiresDaysStr ? parseInt(expiresDaysStr, 10) : 0;
    const expiresAt = expiresDays > 0 ? new Date(Date.now() + expiresDays * 86400000) : null;

    // 1. Insert into grants table
    const [newGrant] = await db
      .insert(grants)
      .values({
        employeeId,
        resourceName,
        grantedBy: currentSession.user.id || currentSession.user.email || "ROOT_ADMIN",
        status: "ACTIVE",
        expiresAt,
      })
      .returning();

    // 2. Append to audit_logs table
    await db.insert(auditLogs).values({
      actorId: currentSession.user.id,
      action: "GRANT_ISSUED",
      targetId: employeeId,
      metadata: {
        grantId: newGrant.id,
        resourceName,
        grantedBy: currentSession.user.email,
        expiresAt: expiresAt ? expiresAt.toISOString() : null,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/");
  }

  // Server Action: Revoke Existing AI Grant
  async function handleRevokeGrant(formData: FormData) {
    "use server";
    const currentSession = await auth();
    if (currentSession?.user?.role !== "ROOT_ADMIN") {
      throw new Error("Unauthorized: Only Root Admin can revoke grants");
    }

    const grantId = formData.get("grantId") as string;
    if (!grantId) return;

    // Fetch existing grant
    const [existing] = await db.select().from(grants).where(eq(grants.id, grantId)).limit(1);
    if (!existing) return;

    // 1. Update status to REVOKED
    await db.update(grants).set({ status: "REVOKED" }).where(eq(grants.id, grantId));

    // 2. Append to audit_logs table
    await db.insert(auditLogs).values({
      actorId: currentSession.user.id,
      action: "GRANT_REVOKED",
      targetId: existing.employeeId,
      metadata: {
        grantId: existing.id,
        resourceName: existing.resourceName,
        revokedBy: currentSession.user.email,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/");
  }

  // Fetch real data directly from PostgreSQL
  let allEmployees: (typeof employees.$inferSelect)[] = [];
  let allGrantsList: any[] = [];
  let fetchError: string | null = null;

  try {
    allEmployees = await db.select().from(employees).orderBy(desc(employees.createdAt));
    
    // Query grants joined with employee details including usage tracking metrics
    allGrantsList = await db
      .select({
        id: grants.id,
        employeeId: grants.employeeId,
        resourceName: grants.resourceName,
        grantedBy: grants.grantedBy,
        status: grants.status,
        accessCount: grants.accessCount,
        lastAccessedAt: grants.lastAccessedAt,
        createdAt: grants.createdAt,
        expiresAt: grants.expiresAt,
        employeeName: employees.name,
        employeeEmail: employees.email,
        employeeAvatar: employees.avatarUrl,
      })
      .from(grants)
      .leftJoin(employees, eq(grants.employeeId, employees.id))
      .orderBy(desc(grants.createdAt));
  } catch (err: any) {
    console.error("[Admin Portal] Query Error:", err);
    fetchError = err?.message || "Failed to query database";
  }

  const activeGrantsCount = allGrantsList.filter((g) => g.status === "ACTIVE").length;
  const revokedGrantsCount = allGrantsList.filter((g) => g.status === "REVOKED").length;
  const totalLaunchesCount = allGrantsList.reduce((acc, g) => acc + (Number(g.accessCount) || 0), 0);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-amber-500/30 relative overflow-hidden bg-gradient-to-r from-amber-500/5 via-slate-900 to-indigo-500/5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>Root Administrator Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Cổng Quản Trị Phân Quyền & Giám Sát AI
            </h1>
            <p className="text-slate-300 text-sm max-w-xl leading-relaxed">
              Quản lý danh mục nhân viên, cấp phát quyền và theo dõi tần suất sử dụng thực tế của từng dịch vụ AI (ChatGPT, Claude, Gemini, Cursor). Mọi hành động khởi chạy và phân quyền đều được lưu vết kiểm toán vĩnh viễn (Audit Log).
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/audit"
              className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-2 transition-colors"
            >
              <span>Xem Nhật Ký Kiểm Toán</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          </div>
        </div>

        {/* Quick Stats Grid with Total AI Launches */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium">Nhân viên</p>
              <p className="text-lg font-bold text-white mt-0.5">{allEmployees.length}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium">Quyền ACTIVE</p>
              <p className="text-lg font-bold text-emerald-400 mt-0.5">{activeGrantsCount}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-800 text-slate-400 flex items-center justify-center shrink-0">
              <XCircle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium">Đã thu hồi</p>
              <p className="text-lg font-bold text-slate-300 mt-0.5">{revokedGrantsCount}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium">Lượt khởi chạy AI</p>
              <p className="text-lg font-bold text-amber-300 mt-0.5">{totalLaunchesCount}</p>
            </div>
          </div>
        </div>
      </div>

      {fetchError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
          Lỗi truy vấn cơ sở dữ liệu: {fetchError}
        </div>
      )}

      {/* Form: Issue New AI Grant */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Cấp Quyền Dịch Vụ AI Mới (Issue AI Grant)</h2>
            <p className="text-xs text-slate-400">Chọn nhân viên từ danh bạ và chỉ định tài nguyên AI được phép truy cập</p>
          </div>
        </div>

        {allEmployees.length === 0 ? (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Chưa có nhân viên nào trong cơ sở dữ liệu. Hãy yêu cầu nhân viên đăng nhập bằng Google OAuth trước để xuất hiện trong danh sách này.
            </span>
          </div>
        ) : (
          <form action={handleCreateGrant} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="employeeId" className="block text-xs font-semibold text-slate-300">
                Nhân viên nhận quyền
              </label>
              <select
                id="employeeId"
                name="employeeId"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="">-- Chọn nhân viên --</option>
                {allEmployees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name || emp.email} ({emp.email}) - [{emp.role}]
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="resourceName" className="block text-xs font-semibold text-slate-300">
                Dịch vụ AI được cấp
              </label>
              <select
                id="resourceName"
                name="resourceName"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="ChatGPT Team">ChatGPT Team (OpenAI)</option>
                <option value="Claude 3.5 Sonnet Pro">Claude 3.5 Sonnet Pro (Anthropic)</option>
                <option value="Gemini Advanced">Gemini Advanced (Google)</option>
                <option value="Cursor Pro / Business">Cursor Pro / Business</option>
                <option value="GitHub Copilot Enterprise">GitHub Copilot Enterprise</option>
                <option value="Midjourney Organization">Midjourney Organization</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="expiresDays" className="block text-xs font-semibold text-slate-300">
                Thời hạn hiệu lực
              </label>
              <div className="flex gap-2">
                <select
                  id="expiresDays"
                  name="expiresDays"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="0">Vô thời hạn (Không hết hạn)</option>
                  <option value="7">7 ngày</option>
                  <option value="30">30 ngày (1 tháng)</option>
                  <option value="90">90 ngày (3 tháng)</option>
                  <option value="365">365 ngày (1 năm)</option>
                </select>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-emerald-600/20 active:scale-[0.98] shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Cấp Quyền
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Table: All Issued Grants */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Danh Sách Quyền Truy Cập AI (Grants Management)</h2>
              <p className="text-xs text-slate-400">Xem trạng thái và thực hiện thu hồi quyền tức thì</p>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
            Tổng: {allGrantsList.length} bản ghi
          </span>
        </div>

        {allGrantsList.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-slate-900/40 border border-slate-800/80 text-slate-400 text-sm">
            Chưa có quyền AI nào được cấp. Hãy sử dụng biểu mẫu phía trên để cấp quyền cho nhân viên.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 uppercase font-mono text-[11px]">
                <tr>
                  <th className="py-3 px-4">Dịch vụ AI</th>
                  <th className="py-3 px-4">Nhân viên được cấp</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4">Lượt dùng</th>
                  <th className="py-3 px-4">Truy cập gần nhất</th>
                  <th className="py-3 px-4">Ngày cấp</th>
                  <th className="py-3 px-4">Hết hạn</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {allGrantsList.map((grant) => {
                  const isActive = grant.status === "ACTIVE";
                  return (
                    <tr key={grant.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-100 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-indigo-400" />
                          {grant.resourceName}
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">ID: {grant.id.slice(0, 8)}...</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          {grant.employeeAvatar ? (
                            <img
                              src={grant.employeeAvatar}
                              alt=""
                              className="w-6 h-6 rounded-full object-cover ring-1 ring-slate-700"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-slate-300 font-bold">
                              {(grant.employeeName || grant.employeeEmail || "U")[0].toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-slate-200">{grant.employeeName || "Chưa có tên"}</p>
                            <p className="text-[11px] text-slate-400 font-mono">{grant.employeeEmail || grant.employeeId}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            ACTIVE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                            <XCircle className="w-3 h-3 text-slate-500" />
                            REVOKED
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-mono text-xs font-semibold bg-slate-800/80 text-amber-300 border border-slate-700">
                          {grant.accessCount || 0}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                        {grant.lastAccessedAt ? (
                          new Date(grant.lastAccessedAt).toLocaleString("vi-VN")
                        ) : (
                          <span className="text-slate-500">Chưa dùng</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        {grant.createdAt ? new Date(grant.createdAt).toLocaleDateString("vi-VN") : "N/A"}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        {grant.expiresAt ? (
                          new Date(grant.expiresAt).toLocaleDateString("vi-VN")
                        ) : (
                          <span className="text-slate-500">Vô thời hạn</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {isActive ? (
                          <form action={handleRevokeGrant} className="inline-block">
                            <input type="hidden" name="grantId" value={grant.id} />
                            <button
                              type="submit"
                              className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-medium transition-colors"
                            >
                              Thu hồi (Revoke)
                            </button>
                          </form>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">Đã thu hồi</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Directory of Employees */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Danh Bạ Nhân Viên (Registered Employees)</h2>
              <p className="text-xs text-slate-400">Bảng định danh người dùng từ Google OAuth 2.0 đồng bộ với PostgreSQL</p>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
            {allEmployees.length} nhân viên
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 uppercase font-mono text-[11px]">
              <tr>
                <th className="py-3 px-4">Nhân viên</th>
                <th className="py-3 px-4">Vai trò (Role)</th>
                <th className="py-3 px-4">Google Subject ID (Sub)</th>
                <th className="py-3 px-4">Internal ID (UUID)</th>
                <th className="py-3 px-4">Ngày tham gia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {allEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      {emp.avatarUrl ? (
                        <img
                          src={emp.avatarUrl}
                          alt=""
                          className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-700"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-xs text-slate-300 font-bold">
                          {(emp.name || emp.email || "U")[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-slate-100">{emp.name || "Chưa có tên"}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{emp.email}</p>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    {emp.role === "ROOT_ADMIN" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                        <ShieldAlert className="w-3 h-3 text-amber-400" />
                        ROOT_ADMIN
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                        <UserCheck className="w-3 h-3 text-slate-400" />
                        EMPLOYEE
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 select-all">
                    {emp.googleSub}
                  </td>

                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 select-all">
                    {emp.id}
                  </td>

                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                    {emp.createdAt ? new Date(emp.createdAt).toLocaleString("vi-VN") : "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
