import React from "react";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db, employees, grants, auditLogs, departments, vaultCredentials } from "@/db";
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
  Building2,
  DollarSign,
  TrendingUp,
  UserPlus,
  Lock,
  Key,
  RefreshCw,
  Sliders,
  Shield,
  EyeOff,
  Radio,
} from "lucide-react";
import { getAllDepartmentsBudgetStats, DepartmentBudgetSummary } from "@/lib/budget";
import { encryptCredential, maskSecret } from "@/lib/vault";
import { getActiveLeaseCount } from "@/lib/session-broker";

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

  // Server Action: Create Department
  async function handleCreateDepartment(formData: FormData) {
    "use server";
    const currentSession = await auth();
    if (currentSession?.user?.role !== "ROOT_ADMIN") {
      throw new Error("Unauthorized: Only Root Admin can create departments");
    }

    const name = (formData.get("name") as string)?.trim();
    const code = (formData.get("code") as string)?.trim().toUpperCase();
    const monthlyBudgetUsd = (formData.get("monthlyBudgetUsd") as string)?.trim() || "500.00";

    if (!name || !code) return;

    const [dept] = await db
      .insert(departments)
      .values({
        name,
        code,
        monthlyBudgetUsd,
      })
      .returning();

    await db.insert(auditLogs).values({
      actorId: currentSession.user.id,
      action: "DEPARTMENT_CREATED",
      targetId: dept.id,
      metadata: {
        departmentName: dept.name,
        departmentCode: dept.code,
        monthlyBudgetUsd: dept.monthlyBudgetUsd,
        createdBy: currentSession.user.email,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/");
  }

  // Server Action: Assign Employee to Department
  async function handleAssignDepartment(formData: FormData) {
    "use server";
    const currentSession = await auth();
    if (currentSession?.user?.role !== "ROOT_ADMIN") {
      throw new Error("Unauthorized: Only Root Admin can assign departments");
    }

    const employeeId = formData.get("employeeId") as string;
    const departmentId = (formData.get("departmentId") as string) || null;

    if (!employeeId) return;

    await db
      .update(employees)
      .set({
        departmentId: departmentId === "NONE" ? null : departmentId,
      })
      .where(eq(employees.id, employeeId));

    await db.insert(auditLogs).values({
      actorId: currentSession.user.id,
      action: "DEPARTMENT_ASSIGNED",
      targetId: employeeId,
      metadata: {
        assignedDepartmentId: departmentId,
        updatedBy: currentSession.user.email,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/");
  }

  // Server Action: Create Shared Vault Credential
  async function handleCreateVaultCredential(formData: FormData) {
    "use server";
    const currentSession = await auth();
    if (currentSession?.user?.role !== "ROOT_ADMIN") {
      throw new Error("Unauthorized: Only Root Admin can manage vault credentials");
    }

    const resourceName = (formData.get("resourceName") as string)?.trim();
    const accountEmail = (formData.get("accountEmail") as string)?.trim();
    const secret = (formData.get("secret") as string)?.trim();
    const maxConcurrencyStr = (formData.get("maxConcurrency") as string)?.trim() || "1";

    if (!resourceName || !accountEmail || !secret) return;

    const maxConcurrency = Math.max(1, parseInt(maxConcurrencyStr, 10) || 1);
    const { encryptedSecret, iv, authTag } = encryptCredential(secret);

    const [newCred] = await db
      .insert(vaultCredentials)
      .values({
        resourceName,
        accountEmail,
        encryptedSecret,
        iv,
        authTag,
        maxConcurrency,
        status: "ACTIVE",
        lastRotatedAt: new Date(),
      })
      .returning();

    await db.insert(auditLogs).values({
      actorId: currentSession.user.id,
      action: "VAULT_CREDENTIAL_CREATED",
      targetId: newCred.id,
      metadata: {
        resourceName,
        accountEmail,
        maxConcurrency,
        createdBy: currentSession.user.email,
        encryptionAlgorithm: "AES-256-GCM",
      },
    });

    revalidatePath("/admin");
    revalidatePath("/");
  }

  // Server Action: Rotate Shared Vault Credential
  async function handleRotateVaultCredential(formData: FormData) {
    "use server";
    const currentSession = await auth();
    if (currentSession?.user?.role !== "ROOT_ADMIN") {
      throw new Error("Unauthorized: Only Root Admin can rotate vault credentials");
    }

    const credentialId = formData.get("credentialId") as string;
    const newSecret = (formData.get("newSecret") as string)?.trim();

    if (!credentialId || !newSecret) return;

    const { encryptedSecret, iv, authTag } = encryptCredential(newSecret);

    const [updated] = await db
      .update(vaultCredentials)
      .set({
        encryptedSecret,
        iv,
        authTag,
        status: "ACTIVE",
        lastRotatedAt: new Date(),
      })
      .where(eq(vaultCredentials.id, credentialId))
      .returning();

    await db.insert(auditLogs).values({
      actorId: currentSession.user.id,
      action: "VAULT_CREDENTIAL_ROTATED",
      targetId: credentialId,
      metadata: {
        resourceName: updated?.resourceName,
        rotatedBy: currentSession.user.email,
        timestamp: new Date().toISOString(),
      },
    });

    revalidatePath("/admin");
    revalidatePath("/");
  }

  // Server Action: Update Vault Credential Status
  async function handleUpdateVaultStatus(formData: FormData) {
    "use server";
    const currentSession = await auth();
    if (currentSession?.user?.role !== "ROOT_ADMIN") {
      throw new Error("Unauthorized: Only Root Admin can update vault status");
    }

    const credentialId = formData.get("credentialId") as string;
    const status = (formData.get("status") as string) || "ACTIVE";

    if (!credentialId) return;

    await db
      .update(vaultCredentials)
      .set({ status })
      .where(eq(vaultCredentials.id, credentialId));

    await db.insert(auditLogs).values({
      actorId: currentSession.user.id,
      action: "VAULT_STATUS_UPDATED",
      targetId: credentialId,
      metadata: {
        newStatus: status,
        updatedBy: currentSession.user.email,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/");
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
  let allDepartments: (typeof departments.$inferSelect)[] = [];
  let departmentBudgetSummaries: DepartmentBudgetSummary[] = [];
  let allVaultCreds: any[] = [];
  let fetchError: string | null = null;

  try {
    allEmployees = await db.select().from(employees).orderBy(desc(employees.createdAt));
    allDepartments = await db.select().from(departments).orderBy(departments.name);
    departmentBudgetSummaries = await getAllDepartmentsBudgetStats();

    // Query vault credentials and active leases from Upstash Redis
    const rawVaultCreds = await db.select().from(vaultCredentials).orderBy(desc(vaultCredentials.createdAt));
    allVaultCreds = await Promise.all(
      rawVaultCreds.map(async (c) => {
        const activeCount = await getActiveLeaseCount(c.id);
        return {
          ...c,
          activeCount,
        };
      })
    );
    
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
        employeeDeptId: employees.departmentId,
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
  const totalActiveLeases = allVaultCreds.reduce((acc, c) => acc + (c.activeCount || 0), 0);

  // Budget calculations across all departments
  const totalCompanyBudgetUsd = departmentBudgetSummaries.reduce((acc, d) => acc + d.monthlyBudgetUsd, 0);
  const totalCompanySpentUsd = departmentBudgetSummaries.reduce((acc, d) => acc + d.spentUsd, 0);
  const alertDeptsCount = departmentBudgetSummaries.filter((d) => d.status === "WARNING" || d.status === "EXCEEDED").length;

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

        {/* Quick Stats Grid with Total AI Launches, Budget Governance, and Shared Vault Leases */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-medium">Nhân viên</p>
              <p className="text-base font-bold text-white mt-0.5">{allEmployees.length}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-medium">Quyền ACTIVE</p>
              <p className="text-base font-bold text-emerald-400 mt-0.5">{activeGrantsCount}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-medium">Lượt launch</p>
              <p className="text-base font-bold text-amber-300 mt-0.5">{totalLaunchesCount}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-medium">Chi phí AI</p>
              <p className="text-base font-bold text-cyan-300 mt-0.5">${totalCompanySpentUsd.toFixed(2)}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-medium">Tài khoản Vault</p>
              <p className="text-base font-bold text-violet-300 mt-0.5">{allVaultCreds.length}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-medium">Phiên Live (Redis)</p>
              <p className="text-base font-bold text-rose-300 mt-0.5">{totalActiveLeases}</p>
            </div>
          </div>
        </div>

        {/* Company Budget Secondary Summary Banner */}
        <div className="mt-4 p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-300 gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-400" />
            <span>Tổng ngân sách AI: <strong className="text-white">${totalCompanyBudgetUsd.toFixed(2)}</strong></span>
            <span className="text-slate-500">|</span>
            <span>{allDepartments.length} phòng ban</span>
          </div>

          <div className="flex items-center gap-2">
            {alertDeptsCount > 0 ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/30">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                {alertDeptsCount} phòng ban chạm ngưỡng cảnh báo / vượt trần
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Mọi phòng ban trong giới hạn ngân sách
              </span>
            )}
          </div>
        </div>
      </div>

      {fetchError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
          Lỗi truy vấn cơ sở dữ liệu: {fetchError}
        </div>
      )}

      {/* ==================== SECTION: DEPARTMENT & BUDGET GOVERNANCE ==================== */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Quản Trị Ngân Sách & Phòng Ban (Department & Quota Governance)</h2>
              <p className="text-xs text-slate-400">Thiết lập trần chi phí AI tháng theo bộ phận, phân bổ nhân sự và giám sát định mức chi tiêu</p>
            </div>
          </div>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-lg border border-cyan-500/20">
            {allDepartments.length} phòng ban
          </span>
        </div>

        {/* 2 Forms: Create Dept & Assign Employee */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Form 1: Create Department */}
          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-cyan-400" />
              Tạo Phòng Ban Mới
            </h3>
            <form action={handleCreateDepartment} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Tên phòng ban</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Kỹ thuật phần mềm (Engineering)"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Mã code</label>
                  <input
                    type="text"
                    name="code"
                    required
                    placeholder="ENG"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder:text-slate-500 uppercase focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Ngân sách tháng ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="monthlyBudgetUsd"
                    required
                    defaultValue="500.00"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-all shadow-md shadow-cyan-600/20 active:scale-[0.98]"
              >
                Tạo Phòng Ban
              </button>
            </form>
          </div>

          {/* Form 2: Assign Employee to Department */}
          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-indigo-400" />
              Phân Bổ Nhân Viên Vào Phòng Ban
            </h3>
            {allDepartments.length === 0 ? (
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                Chưa có phòng ban nào. Hãy tạo phòng ban trước.
              </div>
            ) : (
              <form action={handleAssignDepartment} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Chọn nhân viên</label>
                  <select
                    name="employeeId"
                    required
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Chọn nhân viên --</option>
                    {allEmployees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name || emp.email} ({emp.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Gán vào phòng ban</label>
                  <select
                    name="departmentId"
                    required
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="NONE">-- Không trực thuộc (Bỏ gán) --</option>
                    {allDepartments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name} [{dept.code}] - Hạn mức: ${dept.monthlyBudgetUsd}/tháng
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-md shadow-indigo-600/20 active:scale-[0.98]"
                >
                  Cập Nhật Phân Bổ
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Table: Department Budget & Quota Tracking */}
        {departmentBudgetSummaries.length > 0 && (
          <div className="pt-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Theo Dõi Mức Tiêu Thụ Ngân Sách Từng Phòng Ban
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 uppercase font-mono text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Phòng ban</th>
                    <th className="py-3 px-4">Nhân sự</th>
                    <th className="py-3 px-4">Ngân sách tháng</th>
                    <th className="py-3 px-4">Đã dùng ($)</th>
                    <th className="py-3 px-4">Còn lại ($)</th>
                    <th className="py-3 px-4">Tiến độ tiêu thụ</th>
                    <th className="py-3 px-4">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {departmentBudgetSummaries.map((dept) => {
                    const isExceeded = dept.status === "EXCEEDED";
                    const isWarning = dept.status === "WARNING";
                    const barColor = isExceeded ? "bg-rose-500" : isWarning ? "bg-amber-400" : "bg-emerald-400";
                    return (
                      <tr key={dept.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-100 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-cyan-400" />
                            {dept.name}
                          </div>
                          <span className="text-[10px] font-mono text-slate-500">Mã: {dept.code}</span>
                        </td>

                        <td className="py-3 px-4 font-mono">
                          {dept.employeeCount} nhân viên
                        </td>

                        <td className="py-3 px-4 font-mono font-medium text-slate-200">
                          ${dept.monthlyBudgetUsd.toFixed(2)}
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-amber-300">
                          ${dept.spentUsd.toFixed(2)}
                        </td>

                        <td className="py-3 px-4 font-mono text-emerald-300">
                          ${dept.remainingUsd.toFixed(2)}
                        </td>

                        <td className="py-3 px-4 w-48">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-mono">
                              <span>{dept.percentageUsed}%</span>
                              <span className="text-slate-500">{dept.totalLaunches} lượt</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className={`h-full ${barColor} transition-all duration-500`}
                                style={{ width: `${Math.min(100, dept.percentageUsed)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          {isExceeded ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/30">
                              <AlertTriangle className="w-3 h-3 text-rose-400" />
                              VƯỢT HẠN MỨC
                            </span>
                          ) : isWarning ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                              <AlertTriangle className="w-3 h-3 text-amber-400" />
                              CẢNH BÁO TIỆM CẬN
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" />
                              AN TOÀN
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ==================== SECTION: SHARED CREDENTIAL VAULT & CONCURRENCY ==================== */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-violet-500/30 space-y-6 bg-gradient-to-b from-violet-500/5 to-slate-900/40">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center border border-violet-500/20">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Kho Tài Khoản Dùng Chung & Điều Phối Phiên (Shared Credential Vault)
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  AES-256-GCM + Redis Mutex
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Lưu trữ chuỗi bí mật/mật khẩu tài khoản dùng chung an toàn tuyệt đối. Giới hạn số ghế truy cập đồng thời qua Upstash Redis Lease.
              </p>
            </div>
          </div>
        </div>

        {/* Vault Management Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Panel A: Store New Shared Credential */}
          <div className="p-4 sm:p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-violet-400" />
              Lưu Trữ Mật Khẩu / API Key Dùng Chung
            </h3>
            <form action={handleCreateVaultCredential} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Công cụ AI</label>
                <select
                  name="resourceName"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-violet-500"
                >
                  <option value="ChatGPT Team">ChatGPT Team (OpenAI)</option>
                  <option value="Claude 3.5 Sonnet Pro">Claude 3.5 Sonnet Pro (Anthropic)</option>
                  <option value="Cursor Pro / Business">Cursor Pro / Business (Anysphere)</option>
                  <option value="Gemini Advanced">Gemini Advanced (Google)</option>
                  <option value="GitHub Copilot Enterprise">GitHub Copilot Enterprise (GitHub)</option>
                  <option value="Midjourney Organization">Midjourney Organization (Midjourney)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Email / Tên định danh tài khoản dùng chung</label>
                <input
                  type="email"
                  name="accountEmail"
                  required
                  placeholder="shared-eng@company.com"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-violet-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1 flex justify-between">
                  <span>Mật khẩu hoặc Master Secret</span>
                  <span className="text-violet-400 text-[10px]">Tự động mã hóa AES-256-GCM</span>
                </label>
                <input
                  type="password"
                  name="secret"
                  required
                  placeholder="••••••••••••••••"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-violet-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Giới hạn số phiên đồng thời (Concurrency Max Slots)
                </label>
                <input
                  type="number"
                  name="maxConcurrency"
                  min="1"
                  max="50"
                  defaultValue="2"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-violet-500 font-mono"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Khi đạt giới hạn, người thứ N+1 sẽ bị hoãn cho đến khi đồng nghiệp trả slot.
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-2 px-4 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-all shadow-md shadow-violet-600/20 active:scale-[0.98]"
              >
                Mã Hóa & Lưu Vào Vault
              </button>
            </form>
          </div>

          {/* Panel B: Rotate Existing Credential */}
          <div className="p-4 sm:p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-amber-400" />
                Xoay Vòng Mật Khẩu (Credential Rotation)
              </h3>
              {allVaultCreds.length === 0 ? (
                <div className="p-4 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs">
                  Chưa có tài khoản nào trong Vault để xoay vòng.
                </div>
              ) : (
                <form action={handleRotateVaultCredential} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">Chọn tài khoản Vault cần xoay vòng</label>
                    <select
                      name="credentialId"
                      required
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                    >
                      {allVaultCreds.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.resourceName} ({c.accountEmail}) - Trạng thái: {c.status}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">Mật khẩu hoặc API Key mới</label>
                    <input
                      type="password"
                      name="newSecret"
                      required
                      placeholder="Nhập khóa/mật khẩu mới..."
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>

                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Hệ thống sẽ mã hóa lại bằng khóa mới, cập nhật mốc thời gian <code className="text-amber-300">lastRotatedAt</code> và ghi nhật ký kiểm toán vĩnh viễn.
                  </p>

                  <button
                    type="submit"
                    className="w-full py-2 px-4 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition-all shadow-md shadow-amber-600/20 active:scale-[0.98]"
                  >
                    Xoay Vòng Mật Khẩu Ngay
                  </button>
                </form>
              )}
            </div>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                Chuẩn Mã Hóa AES-256-GCM
              </span>
              <p>Mỗi tài khoản được mã hóa với IV ngẫu nhiên 96-bit và Authentication Tag 128-bit chống mọi hành vi giả mạo ciphertext.</p>
            </div>
          </div>
        </div>

        {/* Table: Shared Vault Credentials & Live Concurrency Monitor */}
        <div className="pt-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
            <span>Danh Sách Tài Khoản Trong Vault & Giám Sát Phiên Đồng Thời (Live Redis)</span>
            <span className="text-[10px] text-slate-500 font-mono font-normal">
              {allVaultCreds.length} tài khoản • {totalActiveLeases} phiên đang hoạt động
            </span>
          </h3>

          {allVaultCreds.length === 0 ? (
            <div className="p-6 rounded-xl bg-slate-900/40 border border-slate-800 text-center text-slate-400 text-xs">
              Chưa có tài khoản nào được lưu trữ trong Vault. Thêm tài khoản dùng chung ở biểu mẫu phía trên.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 uppercase font-mono text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Dịch vụ AI</th>
                    <th className="py-3 px-4">Tài khoản dùng chung</th>
                    <th className="py-3 px-4">Bảo mật</th>
                    <th className="py-3 px-4">Phiên đồng thời (Live Redis)</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4">Lần xoay gần nhất</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {allVaultCreds.map((cred) => {
                    const isAtCapacity = cred.activeCount >= cred.maxConcurrency;
                    return (
                      <tr key={cred.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 font-semibold text-white">
                          {cred.resourceName}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-300">
                          {cred.accountEmail}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-violet-500/10 text-violet-300 border border-violet-500/20">
                            <Lock className="w-2.5 h-2.5" />
                            AES-256-GCM
                          </span>
                        </td>
                        <td className="py-3 px-4 w-44">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-mono">
                              <span className={isAtCapacity ? "text-rose-400 font-bold" : "text-emerald-400"}>
                                {cred.activeCount} / {cred.maxConcurrency} slots
                              </span>
                              <span className="text-slate-500">
                                {isAtCapacity ? "HẾT GHẾ" : "CÒN CHỖ"}
                              </span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  isAtCapacity ? "bg-rose-500" : cred.activeCount > 0 ? "bg-amber-500" : "bg-emerald-500"
                                }`}
                                style={{ width: `${Math.min(100, (cred.activeCount / cred.maxConcurrency) * 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {cred.status === "ACTIVE" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" />
                              ACTIVE
                            </span>
                          ) : cred.status === "ROTATING" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                              <RefreshCw className="w-3 h-3 text-amber-400 animate-spin" />
                              ROTATING
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-500/10 text-rose-300 border border-rose-500/30">
                              <XCircle className="w-3 h-3 text-rose-400" />
                              SUSPENDED
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-[11px]">
                          {cred.lastRotatedAt
                            ? new Date(cred.lastRotatedAt).toLocaleDateString("vi-VN", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              })
                            : "Ban đầu"}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <form action={handleUpdateVaultStatus} className="inline-block">
                            <input type="hidden" name="credentialId" value={cred.id} />
                            {cred.status === "ACTIVE" ? (
                              <input type="hidden" name="status" value="SUSPENDED" />
                            ) : (
                              <input type="hidden" name="status" value="ACTIVE" />
                            )}
                            <button
                              type="submit"
                              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                                cred.status === "ACTIVE"
                                  ? "bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700"
                                  : "bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30"
                              }`}
                            >
                              {cred.status === "ACTIVE" ? "Tạm dừng" : "Kích hoạt"}
                            </button>
                          </form>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

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
                <th className="py-3 px-4">Phòng ban</th>
                <th className="py-3 px-4">Vai trò (Role)</th>
                <th className="py-3 px-4">Google Subject ID (Sub)</th>
                <th className="py-3 px-4">Internal ID (UUID)</th>
                <th className="py-3 px-4">Ngày tham gia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {allEmployees.map((emp) => {
                const empDept = allDepartments.find((d) => d.id === emp.departmentId);
                return (
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
                      {empDept ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                          <Building2 className="w-3 h-3 text-cyan-400" />
                          {empDept.name} ({empDept.code})
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500 italic">Chưa phân bổ</span>
                      )}
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
              );
            })}
          </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
