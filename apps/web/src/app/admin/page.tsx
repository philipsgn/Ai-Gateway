import React from "react";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db, employees, grants, departments, vaultCredentials, accessRequests } from "@/db";
import { desc, eq, and } from "drizzle-orm";
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
  Download,
  Calendar,
  Zap,
} from "lucide-react";
import { getAllDepartmentsBudgetStats, DepartmentBudgetSummary } from "@/lib/budget";
import { encryptCredential, maskSecret } from "@/lib/vault";
import { getActiveLeaseCount } from "@/lib/session-broker";
import { logAuditEvent } from "@/lib/audit";

export const dynamic = "force-dynamic";

export default async function AdminPortalPage() {
  const session = await auth();
  const isRootAdmin = session?.user?.role === "ROOT_ADMIN";

  // 1. Role Guard: Non-root users or unauthenticated users get 403 Forbidden view
  if (!session || !isRootAdmin) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 rounded-2xl card-cream border border-rose-200 text-center space-y-6 bg-white shadow-cream">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 mx-auto flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-ink-900 tracking-tight">
            403 — Quyền Truy Cập Bị Từ Chối (Access Denied)
          </h1>
          <p className="text-ink-600 text-sm leading-relaxed">
            Khu vực này chỉ dành riêng cho <strong>Root Administrator</strong> được cấu hình trong biến môi trường{" "}
            <code className="text-rose-700 font-mono text-xs bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
              ROOT_ADMIN_EMAIL
            </code>.
          </p>
          <p className="text-ink-500 text-xs">
            Tài khoản hiện tại của bạn:{" "}
            <span className="font-mono text-ink-800 font-medium">
              {session?.user?.email || "Chưa đăng nhập"}
            </span>{" "}
            (Vai trò:{" "}
            <span className="font-mono text-amber-700 font-semibold">
              {session?.user?.role || "GUEST"}
            </span>
            )
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-mint-600 hover:bg-mint-500 text-white text-sm font-semibold transition-all shadow-mint"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay về Không Gian Làm Việc</span>
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

    await logAuditEvent({
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

    await logAuditEvent({
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

    await logAuditEvent({
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

    await logAuditEvent({
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

    await logAuditEvent({
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

    await logAuditEvent({
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

    const [existing] = await db.select().from(grants).where(eq(grants.id, grantId)).limit(1);
    if (!existing) return;

    await db.update(grants).set({ status: "REVOKED" }).where(eq(grants.id, grantId));

    await logAuditEvent({
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

  // Server Action: Approve Access Request (Phase 9)
  async function handleApproveRequest(formData: FormData) {
    "use server";
    const currentSession = await auth();
    if (currentSession?.user?.role !== "ROOT_ADMIN") {
      throw new Error("Unauthorized: Only Root Admin can approve requests");
    }

    const requestId = formData.get("requestId") as string;
    if (!requestId) return;

    const [req] = await db
      .select()
      .from(accessRequests)
      .where(and(eq(accessRequests.id, requestId), eq(accessRequests.status, "PENDING")))
      .limit(1);

    if (!req) return;

    // 1. Insert or activate grant
    const [newGrant] = await db
      .insert(grants)
      .values({
        employeeId: req.employeeId,
        resourceName: req.resourceName,
        grantedBy: currentSession.user.email || "ROOT_ADMIN",
        status: "ACTIVE",
      })
      .returning();

    // 2. Update request status to APPROVED
    await db
      .update(accessRequests)
      .set({
        status: "APPROVED",
        reviewedBy: currentSession.user.email || "ROOT_ADMIN",
        reviewedAt: new Date(),
      })
      .where(eq(accessRequests.id, requestId));

    // 3. Log audit event
    await logAuditEvent({
      actorId: currentSession.user.id || currentSession.user.email,
      action: "REQUEST_APPROVED",
      targetId: req.employeeId,
      metadata: {
        requestId,
        grantId: newGrant.id,
        resourceName: req.resourceName,
        reviewedBy: currentSession.user.email,
        approvedAt: new Date().toISOString(),
      },
    });

    revalidatePath("/admin");
    revalidatePath("/");
  }

  // Server Action: Reject Access Request (Phase 9)
  async function handleRejectRequest(formData: FormData) {
    "use server";
    const currentSession = await auth();
    if (currentSession?.user?.role !== "ROOT_ADMIN") {
      throw new Error("Unauthorized: Only Root Admin can reject requests");
    }

    const requestId = formData.get("requestId") as string;
    const rejectionReason = (formData.get("rejectionReason") as string)?.trim() || "Chưa phù hợp với nhu cầu công việc hiện tại";
    if (!requestId) return;

    const [req] = await db
      .select()
      .from(accessRequests)
      .where(and(eq(accessRequests.id, requestId), eq(accessRequests.status, "PENDING")))
      .limit(1);

    if (!req) return;

    // 1. Update request status to REJECTED
    await db
      .update(accessRequests)
      .set({
        status: "REJECTED",
        reviewedBy: currentSession.user.email || "ROOT_ADMIN",
        reviewedAt: new Date(),
        rejectionReason,
      })
      .where(eq(accessRequests.id, requestId));

    // 2. Log audit event
    await logAuditEvent({
      actorId: currentSession.user.id || currentSession.user.email,
      action: "REQUEST_REJECTED",
      targetId: req.employeeId,
      metadata: {
        requestId,
        resourceName: req.resourceName,
        reviewedBy: currentSession.user.email,
        rejectionReason,
        rejectedAt: new Date().toISOString(),
      },
    });

    revalidatePath("/admin");
    revalidatePath("/");
  }

  // Fetch real data directly from PostgreSQL & Redis
  let allEmployees: (typeof employees.$inferSelect)[] = [];
  let allGrantsList: any[] = [];
  let allDepartments: (typeof departments.$inferSelect)[] = [];
  let departmentBudgetSummaries: DepartmentBudgetSummary[] = [];
  let allVaultCreds: any[] = [];
  let allRequestsList: any[] = [];
  let fetchError: string | null = null;

  try {
    allEmployees = await db.select().from(employees).orderBy(desc(employees.createdAt));
    allDepartments = await db.select().from(departments).orderBy(departments.name);
    departmentBudgetSummaries = await getAllDepartmentsBudgetStats();

    allRequestsList = await db
      .select({
        id: accessRequests.id,
        employeeId: accessRequests.employeeId,
        resourceName: accessRequests.resourceName,
        status: accessRequests.status,
        reviewedBy: accessRequests.reviewedBy,
        reviewedAt: accessRequests.reviewedAt,
        rejectionReason: accessRequests.rejectionReason,
        createdAt: accessRequests.createdAt,
        employeeName: employees.name,
        employeeEmail: employees.email,
        employeeAvatar: employees.avatarUrl,
        employeeDeptId: employees.departmentId,
      })
      .from(accessRequests)
      .leftJoin(employees, eq(accessRequests.employeeId, employees.id))
      .orderBy(desc(accessRequests.createdAt));

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

  const totalCompanyBudgetUsd = departmentBudgetSummaries.reduce((acc, d) => acc + d.monthlyBudgetUsd, 0);
  const totalCompanySpentUsd = departmentBudgetSummaries.reduce((acc, d) => acc + d.spentUsd, 0);
  const alertDeptsCount = departmentBudgetSummaries.filter((d) => d.status === "WARNING" || d.status === "EXCEEDED").length;

  const pendingRequests = allRequestsList.filter((r) => r.status === "PENDING");
  const recentProcessedRequests = allRequestsList.filter((r) => r.status !== "PENDING").slice(0, 5);

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Top Executive Admin Banner */}
      <div className="card-cream p-6 sm:p-8 bg-gradient-to-r from-white via-cream-50 to-mint-50/40 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              <span>Root Administrator Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink-900">
              Cổng Quản Trị Hệ Thống AI
            </h1>
            <p className="text-ink-600 text-sm max-w-xl leading-relaxed">
              Quản lý danh sách nhân sự, phân bổ ngân sách phòng ban và cấp phát quyền sử dụng các công cụ AI công ty một cách dễ dàng và an toàn.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <a
              href="/api/audit/export?format=csv"
              download
              className="px-3.5 py-2.5 rounded-xl bg-mint-600 hover:bg-mint-500 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-mint active:scale-[0.99]"
              title="Xuất nhật ký sử dụng định dạng CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất Báo Cáo (CSV)</span>
            </a>
            <Link
              href="/audit"
              className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-cream-100 text-ink-700 text-xs font-semibold border border-cream-300 flex items-center gap-2 transition-colors shadow-sm"
            >
              <span>Nhật Ký Sử Dụng</span>
              <ExternalLink className="w-3.5 h-3.5 text-ink-400" />
            </Link>
          </div>
        </div>

        {/* Quick KPI Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mt-6 pt-6 border-t border-cream-200">
          <div className="p-3.5 rounded-xl bg-white border border-cream-200 shadow-sm flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cream-200 text-ink-700 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-ink-500 font-medium">Nhân viên</p>
              <p className="text-base font-bold text-ink-900 mt-0.5 font-mono">{allEmployees.length}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-cream-200 shadow-sm flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-mint-50 text-mint-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-ink-500 font-medium">Quyền ACTIVE</p>
              <p className="text-base font-bold text-mint-600 mt-0.5 font-mono">{activeGrantsCount}</p>
            </div>
          </div>

          <div className={`p-3.5 rounded-xl border shadow-sm flex items-center gap-3 ${
            pendingRequests.length > 0
              ? "bg-amber-50/70 border-amber-300"
              : "bg-white border-cream-200"
          }`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              pendingRequests.length > 0 ? "bg-amber-500 text-white shadow-sm" : "bg-cream-100 text-ink-500"
            }`}>
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-ink-500 font-medium">Chờ duyệt</p>
              <p className={`text-base font-bold mt-0.5 font-mono ${
                pendingRequests.length > 0 ? "text-amber-800" : "text-ink-600"
              }`}>
                {pendingRequests.length}
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-cream-200 shadow-sm flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-ink-500 font-medium">Lượt launch</p>
              <p className="text-base font-bold text-amber-700 mt-0.5 font-mono">{totalLaunchesCount}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-cream-200 shadow-sm flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-mint-50 text-mint-600 flex items-center justify-center shrink-0">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-ink-500 font-medium">Chi phí AI</p>
              <p className="text-base font-bold text-mint-700 mt-0.5 font-mono">${totalCompanySpentUsd.toFixed(2)}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-cream-200 shadow-sm flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cream-200 text-ink-700 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4 text-mint-600" />
            </div>
            <div>
              <p className="text-[10px] text-ink-500 font-medium">Tài khoản Vault</p>
              <p className="text-base font-bold text-ink-900 mt-0.5 font-mono">{allVaultCreds.length}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-cream-200 shadow-sm flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-mint-100 text-mint-700 flex items-center justify-center shrink-0">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-ink-500 font-medium">Phiên Live (Redis)</p>
              <p className="text-base font-bold text-mint-600 mt-0.5 font-mono">{totalActiveLeases}</p>
            </div>
          </div>
        </div>

        {/* Company Budget Secondary Summary Banner */}
        <div className="mt-4 p-3.5 rounded-xl bg-white/70 border border-cream-200 flex flex-wrap items-center justify-between text-xs text-ink-600 gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-mint-600" />
            <span>Tổng ngân sách AI: <strong className="text-ink-900">${totalCompanyBudgetUsd.toFixed(2)}</strong></span>
            <span className="text-cream-400">|</span>
            <span>{allDepartments.length} phòng ban</span>
          </div>

          <div className="flex items-center gap-2">
            {alertDeptsCount > 0 ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                {alertDeptsCount} phòng ban chạm ngưỡng cảnh báo / vượt trần
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-mint-50 text-mint-800 border border-mint-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-mint-600" />
                Mọi phòng ban trong giới hạn ngân sách
              </span>
            )}
          </div>
        </div>
      </div>

      {fetchError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          Lỗi truy vấn cơ sở dữ liệu: {fetchError}
        </div>
      )}

      {/* ==================== SECTION: ACCESS REQUESTS QUEUE (PHASE 9) ==================== */}
      <div className="card-cream p-6 sm:p-8 bg-white space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-ink-900">Hàng Đợi Yêu Cầu Cấp Quyền (Access Requests Queue)</h2>
                {pendingRequests.length > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                    {pendingRequests.length} chờ duyệt
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-mint-50 text-mint-700 border border-mint-200">
                    Đã xử lý hết
                  </span>
                )}
              </div>
              <p className="text-xs text-ink-500">Phê duyệt hoặc từ chối các yêu cầu xin cấp quyền sử dụng công cụ AI từ nhân viên</p>
            </div>
          </div>
          <span className="text-xs font-mono text-ink-600 bg-cream-100 px-3 py-1 rounded-lg border border-cream-300 font-semibold">
            {allRequestsList.length} tổng yêu cầu
          </span>
        </div>

        {/* Pending Requests Cards */}
        {pendingRequests.length === 0 ? (
          <div className="p-8 rounded-2xl bg-cream-50/70 border border-cream-200 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-mint-600 mx-auto" />
            <p className="text-sm font-semibold text-ink-800">Không có yêu cầu nào đang chờ xử lý</p>
            <p className="text-xs text-ink-500">
              Khi nhân viên bấm "Yêu Cầu Cấp Quyền" từ Không Gian Làm Việc, đơn sẽ tự động xuất hiện tại đây để bạn phê duyệt 1-click.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingRequests.map((req) => {
              const dept = allDepartments.find((d) => d.id === req.employeeDeptId);
              return (
                <div
                  key={req.id}
                  className="p-5 rounded-2xl bg-cream-50/50 border border-amber-200/80 hover:border-amber-300 transition-all flex flex-col justify-between space-y-4 shadow-sm"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {req.employeeAvatar ? (
                          <img
                            src={req.employeeAvatar}
                            alt={req.employeeName || "User"}
                            className="w-10 h-10 rounded-xl object-cover border border-cream-300 shadow-sm"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm">
                            {(req.employeeName || "U")[0].toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-sm text-ink-900 leading-tight">
                            {req.employeeName || "Nhân viên"}
                          </p>
                          <p className="text-[11px] text-ink-500 font-mono mt-0.5">{req.employeeEmail}</p>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
                        CHỜ DUYỆT
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-cream-200 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-ink-500">Công cụ xin cấp:</span>
                        <span className="font-bold text-mint-800 bg-mint-50 px-2 py-0.5 rounded border border-mint-200">
                          {req.resourceName}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-ink-500">Phòng ban:</span>
                        <span className="font-medium text-ink-700">
                          {dept ? `${dept.name} (${dept.code})` : "Chưa phân bổ"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-ink-400">Thời gian gửi:</span>
                        <span className="text-ink-600 font-mono">
                          {new Date(req.createdAt).toLocaleString("vi-VN")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Approve & Reject */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-cream-200">
                    <form action={handleApproveRequest}>
                      <input type="hidden" name="requestId" value={req.id} />
                      <button
                        type="submit"
                        className="w-full py-2 px-3 rounded-xl bg-mint-600 hover:bg-mint-500 text-white text-xs font-semibold shadow-mint flex items-center justify-center gap-1.5 transition-all active:scale-[0.99]"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Phê Duyệt</span>
                      </button>
                    </form>

                    <form action={handleRejectRequest}>
                      <input type="hidden" name="requestId" value={req.id} />
                      <button
                        type="submit"
                        className="w-full py-2 px-3 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-[0.99]"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Từ Chối</span>
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Recently Processed Requests Log (Summary) */}
        {recentProcessedRequests.length > 0 && (
          <div className="pt-4 border-t border-cream-200">
            <h3 className="text-xs font-bold text-ink-700 uppercase tracking-wider mb-3">
              Yêu cầu đã xử lý gần đây
            </h3>
            <div className="space-y-2">
              {recentProcessedRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-3 rounded-xl bg-white border border-cream-200 flex items-center justify-between text-xs gap-3"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        req.status === "APPROVED" ? "bg-mint-500" : "bg-rose-500"
                      }`}
                    />
                    <div>
                      <span className="font-semibold text-ink-800">{req.employeeName || req.employeeEmail}</span>{" "}
                      <span className="text-ink-500">yêu cầu</span>{" "}
                      <strong className="text-ink-900">{req.resourceName}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        req.status === "APPROVED"
                          ? "bg-mint-50 text-mint-700 border border-mint-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      {req.status === "APPROVED" ? "ĐÃ PHÊ DUYỆT" : "ĐÃ TỪ CHỐI"}
                    </span>
                    <span className="text-[11px] text-ink-400 font-mono hidden sm:inline">
                      {req.reviewedAt ? new Date(req.reviewedAt).toLocaleDateString("vi-VN") : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ==================== SECTION: DEPARTMENT & BUDGET GOVERNANCE ==================== */}
      <div className="card-cream p-6 sm:p-8 bg-white space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-mint-50 text-mint-600 flex items-center justify-center border border-mint-200">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-ink-900">Quản Trị Ngân Sách & Phòng Ban (Department Governance)</h2>
              <p className="text-xs text-ink-500">Thiết lập trần chi phí AI tháng theo bộ phận, phân bổ nhân sự và giám sát định mức chi tiêu</p>
            </div>
          </div>
          <span className="text-xs font-mono text-mint-800 bg-mint-50 px-3 py-1 rounded-lg border border-mint-200 font-semibold">
            {allDepartments.length} phòng ban
          </span>
        </div>

        {/* 2 Forms: Create Dept & Assign Employee */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Form 1: Create Department */}
          <div className="p-5 rounded-2xl bg-cream-50/70 border border-cream-200 space-y-4">
            <h3 className="text-sm font-semibold text-ink-900 flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-mint-600" />
              Tạo Phòng Ban Mới
            </h3>
            <form action={handleCreateDepartment} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-ink-700 mb-1">Tên phòng ban</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Kỹ thuật phần mềm (Engineering)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-cream-300 text-xs text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-mint-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-ink-700 mb-1">Mã code</label>
                  <input
                    type="text"
                    name="code"
                    required
                    placeholder="ENG"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-cream-300 text-xs text-ink-900 placeholder:text-ink-400 uppercase focus:outline-none focus:border-mint-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-ink-700 mb-1">Ngân sách tháng ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="monthlyBudgetUsd"
                    required
                    defaultValue="500.00"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-cream-300 text-xs text-ink-900 focus:outline-none focus:border-mint-500 font-mono"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-mint-600 hover:bg-mint-500 text-white text-xs font-semibold transition-all shadow-mint active:scale-[0.98]"
              >
                Tạo Phòng Ban
              </button>
            </form>
          </div>

          {/* Form 2: Assign Employee to Department */}
          <div className="p-5 rounded-2xl bg-cream-50/70 border border-cream-200 space-y-4">
            <h3 className="text-sm font-semibold text-ink-900 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-mint-600" />
              Phân Bổ Nhân Viên Vào Phòng Ban
            </h3>
            {allDepartments.length === 0 ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                Chưa có phòng ban nào. Hãy tạo phòng ban trước.
              </div>
            ) : (
              <form action={handleAssignDepartment} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-ink-700 mb-1">Chọn nhân viên</label>
                  <select
                    name="employeeId"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-cream-300 text-xs text-ink-900 focus:outline-none focus:border-mint-500"
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
                  <label className="block text-[11px] font-semibold text-ink-700 mb-1">Gán vào phòng ban</label>
                  <select
                    name="departmentId"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-cream-300 text-xs text-ink-900 focus:outline-none focus:border-mint-500"
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
                  className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-cream-100 text-ink-800 text-xs font-semibold border border-cream-300 shadow-sm transition-all active:scale-[0.98]"
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
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-3">
              Theo Dõi Mức Tiêu Thụ Ngân Sách Từng Phòng Ban
            </h3>
            <div className="overflow-x-auto card-cream border border-cream-200">
              <table className="w-full text-left text-xs text-ink-700">
                <thead className="bg-cream-100/90 text-ink-600 border-b border-cream-200 uppercase font-mono text-[11px]">
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
                <tbody className="divide-y divide-cream-200/80 font-sans">
                  {departmentBudgetSummaries.map((dept) => {
                    const isExceeded = dept.status === "EXCEEDED";
                    const isWarning = dept.status === "WARNING";
                    const barColor = isExceeded ? "bg-rose-500" : isWarning ? "bg-amber-400" : "bg-mint-500";
                    return (
                      <tr key={dept.id} className="hover:bg-cream-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-ink-900 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-mint-500" />
                            {dept.name}
                          </div>
                          <span className="text-[10px] font-mono text-ink-400">Mã: {dept.code}</span>
                        </td>

                        <td className="py-3.5 px-4 font-mono">
                          {dept.employeeCount} nhân viên
                        </td>

                        <td className="py-3.5 px-4 font-mono font-medium text-ink-800">
                          ${dept.monthlyBudgetUsd.toFixed(2)}
                        </td>

                        <td className="py-3.5 px-4 font-mono font-bold text-amber-700">
                          ${dept.spentUsd.toFixed(2)}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-mint-700 font-semibold">
                          ${dept.remainingUsd.toFixed(2)}
                        </td>

                        <td className="py-3.5 px-4 w-48">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-mono">
                              <span className="font-semibold">{dept.percentageUsed}%</span>
                              <span className="text-ink-400">{dept.totalLaunches} lượt</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-cream-200 overflow-hidden">
                              <div
                                className={`h-full ${barColor} transition-all duration-500`}
                                style={{ width: `${Math.min(100, dept.percentageUsed)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          {isExceeded ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              <AlertTriangle className="w-3 h-3 text-rose-500" />
                              VƯỢT HẠN MỨC
                            </span>
                          ) : isWarning ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              CẢNH BÁO TIỆM CẬN
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-mint-50 text-mint-800 border border-mint-200">
                              <CheckCircle2 className="w-3 h-3 text-mint-600" />
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
      <div className="card-cream p-6 sm:p-8 bg-white space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-mint-50 text-mint-600 flex items-center justify-center border border-mint-200">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-ink-900 flex items-center gap-2">
                Kho Tài Khoản Dùng Chung (Shared Credential Vault)
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-mint-100 text-mint-800 border border-mint-200">
                  Bảo mật tự động + Giới hạn ghế đồng thời
                </span>
              </h2>
              <p className="text-xs text-ink-500">
                Lưu trữ mật khẩu dùng chung an toàn tuyệt đối. Giới hạn số ghế truy cập đồng thời qua Upstash Redis Lease Mutex.
              </p>
            </div>
          </div>
        </div>

        {/* Vault Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Panel A: Store New Shared Credential */}
          <div className="p-5 rounded-2xl bg-cream-50/70 border border-cream-200 space-y-4">
            <h3 className="text-sm font-semibold text-ink-900 flex items-center gap-2">
              <Key className="w-4 h-4 text-mint-600" />
              Lưu Trữ Mật Khẩu / API Key Dùng Chung
            </h3>
            <form action={handleCreateVaultCredential} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-ink-700 mb-1">Công cụ AI</label>
                <select
                  name="resourceName"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-cream-300 text-xs text-ink-900 focus:outline-none focus:border-mint-500"
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
                <label className="block text-[11px] font-semibold text-ink-700 mb-1">Email / Tên định danh tài khoản dùng chung</label>
                <input
                  type="email"
                  name="accountEmail"
                  required
                  placeholder="shared-eng@company.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-cream-300 text-xs text-ink-900 focus:outline-none focus:border-mint-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-ink-700 mb-1 flex justify-between">
                  <span>Mật khẩu hoặc Master Secret</span>
                  <span className="text-mint-700 text-[10px] font-semibold">Tự động mã hóa an toàn</span>
                </label>
                <input
                  type="password"
                  name="secret"
                  required
                  placeholder="••••••••••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-cream-300 text-xs text-ink-900 focus:outline-none focus:border-mint-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-ink-700 mb-1">
                  Giới hạn số phiên đồng thời (Concurrency Max Slots)
                </label>
                <input
                  type="number"
                  name="maxConcurrency"
                  min="1"
                  max="50"
                  defaultValue="2"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-cream-300 text-xs text-ink-900 focus:outline-none focus:border-mint-500 font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-mint-600 hover:bg-mint-500 text-white text-xs font-semibold transition-all shadow-mint active:scale-[0.98]"
              >
                Mã Hóa & Lưu Vào Vault
              </button>
            </form>
          </div>

          {/* Panel B: Rotate Existing Credential */}
          <div className="p-5 rounded-2xl bg-cream-50/70 border border-cream-200 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-ink-900 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-amber-600" />
                Xoay Vòng Mật Khẩu (Credential Rotation)
              </h3>
              {allVaultCreds.length === 0 ? (
                <div className="p-4 rounded-xl bg-cream-100 border border-cream-200 text-ink-600 text-xs">
                  Chưa có tài khoản nào trong Vault để xoay vòng.
                </div>
              ) : (
                <form action={handleRotateVaultCredential} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-ink-700 mb-1">Chọn tài khoản Vault</label>
                    <select
                      name="credentialId"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-cream-300 text-xs text-ink-900 focus:outline-none focus:border-amber-500"
                    >
                      {allVaultCreds.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.resourceName} ({c.accountEmail}) - Trạng thái: {c.status}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-ink-700 mb-1">Mật khẩu hoặc API Key mới</label>
                    <input
                      type="password"
                      name="newSecret"
                      required
                      placeholder="Nhập khóa/mật khẩu mới..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-cream-300 text-xs text-ink-900 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition-all shadow-sm active:scale-[0.98]"
                  >
                    Xoay Vòng Mật Khẩu Ngay
                  </button>
                </form>
              )}
            </div>

            <div className="p-3 rounded-xl bg-white border border-cream-200 text-[11px] text-ink-600 space-y-1">
              <span className="font-semibold text-ink-800 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-mint-600" />
                Bảo Mật Tài Khoản Công Ty
              </span>
              <p>Mỗi tài khoản được mã hóa với IV ngẫu nhiên 96-bit và Authentication Tag 128-bit chống mọi hành vi giả mạo ciphertext.</p>
            </div>
          </div>
        </div>

        {/* Table: Shared Vault Credentials */}
        <div className="pt-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-3 flex items-center justify-between">
            <span>Danh Sách Tài Khoản Trong Vault & Giám Sát Ghế Live (Redis)</span>
            <span className="text-[10px] text-ink-400 font-mono font-normal">
              {allVaultCreds.length} tài khoản • {totalActiveLeases} phiên đang hoạt động
            </span>
          </h3>

          {allVaultCreds.length === 0 ? (
            <div className="p-6 rounded-xl bg-cream-50 border border-cream-200 text-center text-ink-500 text-xs">
              Chưa có tài khoản nào được lưu trữ trong Vault. Thêm tài khoản dùng chung ở biểu mẫu phía trên.
            </div>
          ) : (
            <div className="overflow-x-auto card-cream border border-cream-200">
              <table className="w-full text-left text-xs text-ink-700">
                <thead className="bg-cream-100/90 text-ink-600 border-b border-cream-200 uppercase font-mono text-[11px]">
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
                <tbody className="divide-y divide-cream-200/80 font-sans">
                  {allVaultCreds.map((cred) => {
                    const isAtCapacity = cred.activeCount >= cred.maxConcurrency;
                    return (
                      <tr key={cred.id} className="hover:bg-cream-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-ink-900">
                          {cred.resourceName}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-ink-600">
                          {cred.accountEmail}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-mint-50 text-mint-800 border border-mint-200">
                            <Lock className="w-2.5 h-2.5 text-mint-600" />
                            Mã hóa an toàn
                          </span>
                        </td>
                        <td className="py-3.5 px-4 w-44">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-mono">
                              <span className={isAtCapacity ? "text-rose-600 font-bold" : "text-mint-700 font-semibold"}>
                                {cred.activeCount} / {cred.maxConcurrency} slots
                              </span>
                              <span className="text-ink-400">
                                {isAtCapacity ? "HẾT GHẾ" : "CÒN CHỖ"}
                              </span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-cream-200 overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  isAtCapacity ? "bg-rose-500" : cred.activeCount > 0 ? "bg-amber-400" : "bg-mint-500"
                                }`}
                                style={{ width: `${Math.min(100, (cred.activeCount / cred.maxConcurrency) * 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {cred.status === "ACTIVE" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-mint-50 text-mint-800 border border-mint-200">
                              <CheckCircle2 className="w-3 h-3 text-mint-600" />
                              ACTIVE
                            </span>
                          ) : cred.status === "ROTATING" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                              <RefreshCw className="w-3 h-3 text-amber-600 animate-spin" />
                              ROTATING
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              SUSPENDED
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-ink-500 text-[11px]">
                          {cred.lastRotatedAt
                            ? new Date(cred.lastRotatedAt).toLocaleDateString("vi-VN", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              })
                            : "Ban đầu"}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <form action={handleUpdateVaultStatus} className="inline-block">
                            <input type="hidden" name="credentialId" value={cred.id} />
                            {cred.status === "ACTIVE" ? (
                              <input type="hidden" name="status" value="SUSPENDED" />
                            ) : (
                              <input type="hidden" name="status" value="ACTIVE" />
                            )}
                            <button
                              type="submit"
                              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors border ${
                                cred.status === "ACTIVE"
                                  ? "bg-white hover:bg-rose-50 text-rose-700 border-rose-200"
                                  : "bg-mint-50 hover:bg-mint-100 text-mint-800 border-mint-200"
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

      {/* ==================== SECTION: ISSUE NEW GRANT ==================== */}
      <div className="card-cream p-6 sm:p-8 bg-white space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-mint-50 text-mint-600 flex items-center justify-center border border-mint-200">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-ink-900">Cấp Quyền Dịch Vụ AI Mới (Issue AI Grant)</h2>
            <p className="text-xs text-ink-500">Chọn nhân viên từ danh bạ và chỉ định tài nguyên AI được phép truy cập</p>
          </div>
        </div>

        {allEmployees.length === 0 ? (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Chưa có nhân viên nào trong cơ sở dữ liệu. Hãy yêu cầu nhân viên đăng nhập bằng Google OAuth trước để xuất hiện trong danh sách này.
            </span>
          </div>
        ) : (
          <form action={handleCreateGrant} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="employeeId" className="block text-xs font-semibold text-ink-700">
                Nhân viên nhận quyền
              </label>
              <select
                id="employeeId"
                name="employeeId"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-cream-300 text-ink-900 text-xs focus:outline-none focus:border-mint-500 transition-colors"
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
              <label htmlFor="resourceName" className="block text-xs font-semibold text-ink-700">
                Dịch vụ AI được cấp
              </label>
              <select
                id="resourceName"
                name="resourceName"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-cream-300 text-ink-900 text-xs focus:outline-none focus:border-mint-500 transition-colors"
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
              <label htmlFor="expiresDays" className="block text-xs font-semibold text-ink-700">
                Thời hạn hiệu lực
              </label>
              <div className="flex gap-2">
                <select
                  id="expiresDays"
                  name="expiresDays"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-cream-300 text-ink-900 text-xs focus:outline-none focus:border-mint-500 transition-colors"
                >
                  <option value="0">Vô thời hạn (Không hết hạn)</option>
                  <option value="7">7 ngày</option>
                  <option value="30">30 ngày (1 tháng)</option>
                  <option value="90">90 ngày (3 tháng)</option>
                  <option value="365">365 ngày (1 năm)</option>
                </select>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-mint-600 hover:bg-mint-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-mint active:scale-[0.98] shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Cấp Quyền</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* ==================== SECTION: ALL GRANTS ==================== */}
      <div className="card-cream p-6 sm:p-8 bg-white space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-mint-50 text-mint-600 flex items-center justify-center border border-mint-200">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-ink-900">Danh Sách Quyền Truy Cập AI (Grants Management)</h2>
              <p className="text-xs text-ink-500">Xem trạng thái và thực hiện thu hồi quyền tức thì</p>
            </div>
          </div>
          <span className="text-xs font-mono text-ink-600 bg-cream-100 px-3 py-1 rounded-lg border border-cream-200">
            Tổng: {allGrantsList.length} bản ghi
          </span>
        </div>

        {allGrantsList.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-cream-50 border border-cream-200 text-ink-500 text-sm">
            Chưa có quyền AI nào được cấp. Hãy sử dụng biểu mẫu phía trên để cấp quyền cho nhân viên.
          </div>
        ) : (
          <div className="overflow-x-auto card-cream border border-cream-200">
            <table className="w-full text-left text-xs text-ink-700">
              <thead className="bg-cream-100/90 text-ink-600 border-b border-cream-200 uppercase font-mono text-[11px]">
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
              <tbody className="divide-y divide-cream-200/80 font-sans">
                {allGrantsList.map((grant) => {
                  const isActive = grant.status === "ACTIVE";
                  return (
                    <tr key={grant.id} className="hover:bg-cream-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-ink-900 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-mint-500" />
                          {grant.resourceName}
                        </div>
                        <span className="text-[10px] font-mono text-ink-400">ID: {grant.id.slice(0, 8)}...</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          {grant.employeeAvatar ? (
                            <img
                              src={grant.employeeAvatar}
                              alt=""
                              className="w-6 h-6 rounded-full object-cover ring-1 ring-cream-300"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-cream-200 flex items-center justify-center text-[10px] text-ink-700 font-bold">
                              {(grant.employeeName || grant.employeeEmail || "U")[0].toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-ink-800">{grant.employeeName || "Chưa có tên"}</p>
                            <p className="text-[11px] text-ink-400 font-mono">{grant.employeeEmail || grant.employeeId}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-mint-50 text-mint-800 border border-mint-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-mint-500 animate-pulse" />
                            ACTIVE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                            <XCircle className="w-3 h-3 text-rose-500" />
                            REVOKED
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-mono text-xs font-semibold bg-cream-100 text-ink-800 border border-cream-200">
                          {grant.accessCount || 0}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-ink-500 text-[11px]">
                        {grant.lastAccessedAt ? (
                          new Date(grant.lastAccessedAt).toLocaleString("vi-VN")
                        ) : (
                          <span className="text-ink-400">Chưa dùng</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-ink-500">
                        {grant.createdAt ? new Date(grant.createdAt).toLocaleDateString("vi-VN") : "N/A"}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-ink-500">
                        {grant.expiresAt ? (
                          new Date(grant.expiresAt).toLocaleDateString("vi-VN")
                        ) : (
                          <span className="text-ink-400">Vô thời hạn</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {isActive ? (
                          <form action={handleRevokeGrant} className="inline-block">
                            <input type="hidden" name="grantId" value={grant.id} />
                            <button
                              type="submit"
                              className="px-3 py-1.5 rounded-lg bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold transition-colors shadow-sm"
                            >
                              Thu hồi
                            </button>
                          </form>
                        ) : (
                          <span className="text-[11px] text-ink-400 italic">Đã thu hồi</span>
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

      {/* ==================== SECTION: EMPLOYEE DIRECTORY ==================== */}
      <div className="card-cream p-6 sm:p-8 bg-white space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-mint-50 text-mint-600 flex items-center justify-center border border-mint-200">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-ink-900">Danh Bạ Nhân Viên (Registered Employees)</h2>
              <p className="text-xs text-ink-500">Bảng định danh người dùng từ Google OAuth 2.0 đồng bộ với PostgreSQL</p>
            </div>
          </div>
          <span className="text-xs font-mono text-ink-600 bg-cream-100 px-3 py-1 rounded-lg border border-cream-200">
            {allEmployees.length} nhân viên
          </span>
        </div>

        <div className="overflow-x-auto card-cream border border-cream-200">
          <table className="w-full text-left text-xs text-ink-700">
            <thead className="bg-cream-100/90 text-ink-600 border-b border-cream-200 uppercase font-mono text-[11px]">
              <tr>
                <th className="py-3 px-4">Nhân viên</th>
                <th className="py-3 px-4">Phòng ban</th>
                <th className="py-3 px-4">Vai trò (Role)</th>
                <th className="py-3 px-4">Google Subject ID (Sub)</th>
                <th className="py-3 px-4">Internal ID (UUID)</th>
                <th className="py-3 px-4">Ngày tham gia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-200/80 font-sans">
              {allEmployees.map((emp) => {
                const empDept = allDepartments.find((d) => d.id === emp.departmentId);
                return (
                  <tr key={emp.id} className="hover:bg-cream-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {emp.avatarUrl ? (
                          <img
                            src={emp.avatarUrl}
                            alt=""
                            className="w-7 h-7 rounded-full object-cover ring-1 ring-cream-300"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-cream-200 flex items-center justify-center text-xs text-ink-700 font-bold">
                            {(emp.name || emp.email || "U")[0].toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-ink-900">{emp.name || "Chưa có tên"}</p>
                          <p className="text-[11px] text-ink-400 font-mono">{emp.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {empDept ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-mint-50 text-mint-800 border border-mint-200">
                          <Building2 className="w-3 h-3 text-mint-600" />
                          {empDept.name} ({empDept.code})
                        </span>
                      ) : (
                        <span className="text-[11px] text-ink-400 italic">Chưa phân bổ</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {emp.role === "ROOT_ADMIN" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          <ShieldAlert className="w-3 h-3 text-amber-600" />
                          ROOT_ADMIN
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-cream-100 text-ink-700 border border-cream-200">
                          <UserCheck className="w-3 h-3 text-mint-600" />
                          EMPLOYEE
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-ink-500 select-all">
                      {emp.googleSub}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-ink-500 select-all">
                      {emp.id}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-ink-500">
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
