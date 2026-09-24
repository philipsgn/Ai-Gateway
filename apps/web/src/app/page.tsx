import React from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth, signIn, signOut } from "@/auth";
import { db, employees, grants, departments, vaultCredentials, accessRequests } from "@/db";
import { eq, and, desc } from "drizzle-orm";
import { checkLoginRateLimit } from "@/lib/redis";
import { logAuditEvent } from "@/lib/audit";
import { getResourceDetails, getAllResources, ResourceInfo } from "@/lib/catalog";
import {
  DepartmentBudgetSummary,
  getDepartmentBudgetStats,
} from "@/lib/budget";
import { getActiveLeaseCount, getUserLease, releaseSessionLease } from "@/lib/session-broker";
import {
  Sparkles,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Compass,
  AlertCircle,
  Building2,
  DollarSign,
  Lock,
  LogOut,
  Send,
  Zap,
  CheckCircle2,
  ArrowRight,
  Layers,
  BookOpen,
  Users,
  Clock,
} from "lucide-react";

interface HomePageProps {
  searchParams: {
    error?: string;
    success?: string;
    tool?: string;
  };
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const session = await auth();

  // Server Action: Handles voluntary release of active session lease
  async function handleReleaseSession(formData: FormData) {
    "use server";
    const currentSession = await auth();
    if (!currentSession?.user?.id) return;
    const credentialId = formData.get("credentialId") as string;
    if (!credentialId) return;

    await releaseSessionLease(credentialId, currentSession.user.id);

    await logAuditEvent({
      actorId: currentSession.user.id,
      action: "SESSION_LEASE_RELEASED",
      targetId: credentialId,
      metadata: {
        employeeEmail: currentSession.user.email,
        releasedAt: new Date().toISOString(),
      },
    });

    revalidatePath("/");
    revalidatePath("/admin");
  }

  // Server Action: Handles 1-click self-service access request (or instant grant for ROOT_ADMIN)
  async function handleRequestAccess(formData: FormData) {
    "use server";
    const currentSession = await auth();
    if (!currentSession?.user?.email) return;

    const resourceName = (formData.get("resourceName") as string)?.trim();
    if (!resourceName) return;

    const rootAdminEmail = process.env.ROOT_ADMIN_EMAIL?.toLowerCase().trim();
    const isRootAdmin = !!(rootAdminEmail && currentSession.user.email.toLowerCase().trim() === rootAdminEmail);

    if (isRootAdmin) {
      // Find employee record
      const [emp] = await db
        .select()
        .from(employees)
        .where(eq(employees.email, currentSession.user.email.toLowerCase().trim()))
        .limit(1);

      if (emp) {
        // Direct instant grant for ROOT_ADMIN
        await db
          .insert(grants)
          .values({
            employeeId: emp.id,
            resourceName,
            grantedBy: "ROOT_ADMIN_SELF",
            status: "ACTIVE",
          })
          .onConflictDoNothing();

        await logAuditEvent({
          actorId: emp.id,
          action: "GRANT_ISSUED",
          targetId: emp.id,
          metadata: {
            resourceName,
            grantedBy: currentSession.user.email,
            mode: "SELF_ASSIGNED_ROOT_ADMIN",
            assignedAt: new Date().toISOString(),
          },
        });

        revalidatePath("/");
        revalidatePath("/admin");
        redirect(`/?success=grant_activated&tool=${encodeURIComponent(resourceName)}`);
      }
    }

    // Normal employee: Insert into accessRequests table + logAuditEvent
    const [emp] = await db
      .select()
      .from(employees)
      .where(eq(employees.email, currentSession.user.email.toLowerCase().trim()))
      .limit(1);

    if (emp) {
      // Check if already pending
      const [existingPending] = await db
        .select()
        .from(accessRequests)
        .where(
          and(
            eq(accessRequests.employeeId, emp.id),
            eq(accessRequests.resourceName, resourceName),
            eq(accessRequests.status, "PENDING")
          )
        )
        .limit(1);

      if (!existingPending) {
        await db.insert(accessRequests).values({
          employeeId: emp.id,
          resourceName,
          status: "PENDING",
        });

        await logAuditEvent({
          actorId: emp.id,
          action: "ACCESS_REQUESTED",
          targetId: resourceName,
          metadata: {
            resourceName,
            employeeEmail: currentSession.user.email,
            employeeName: currentSession.user.name,
            requestedAt: new Date().toISOString(),
            status: "PENDING_REVIEW",
          },
        });
      }
    }

    revalidatePath("/");
    revalidatePath("/admin");
    redirect(`/?success=request_submitted&tool=${encodeURIComponent(resourceName)}`);
  }

  // ---------------------------------------------------------------------------
  // Resilient Employee Identity Resolution (Self-Healing Session Sync)
  // ---------------------------------------------------------------------------
  let dbEmployee: typeof employees.$inferSelect | null = null;

  if (session?.user?.email) {
    try {
      const email = session.user.email.toLowerCase().trim();

      // 1. Query by email first
      const [existing] = await db
        .select()
        .from(employees)
        .where(eq(employees.email, email))
        .limit(1);

      if (existing) {
        dbEmployee = existing;
      } else {
        // 2. Self-Healing Upsert: Automatically register employee into PostgreSQL
        const isRootAdmin = email === process.env.ROOT_ADMIN_EMAIL?.toLowerCase().trim();
        const [synced] = await db
          .insert(employees)
          .values({
            googleSub: (session.user as any)?.googleSub || `google-${email}`,
            email,
            name: session.user?.name || "Employee",
            avatarUrl: session.user?.image || "",
            role: isRootAdmin ? "ROOT_ADMIN" : "EMPLOYEE",
          })
          .onConflictDoUpdate({
            target: employees.email,
            set: {
              name: session.user?.name || "Employee",
              avatarUrl: session.user?.image || "",
              ...(isRootAdmin ? { role: "ROOT_ADMIN" } : {}),
            },
          })
          .returning();
        dbEmployee = synced;
      }
    } catch (err: any) {
      console.error("[PostgreSQL] Error in employee resolution:", err);
    }
  }

  // ---------------------------------------------------------------------------
  // Query Active Grants & Shared Vault Session Info
  // ---------------------------------------------------------------------------
  let userGrants: (typeof grants.$inferSelect)[] = [];
  let userGrantsWithVault: any[] = [];
  let pendingToolNames = new Set<string>();
  let employeeDept: typeof departments.$inferSelect | null = null;
  let deptBudgetStats: DepartmentBudgetSummary | null = null;

  if (dbEmployee?.id) {
    try {
      userGrants = await db
        .select()
        .from(grants)
        .where(and(eq(grants.employeeId, dbEmployee.id), eq(grants.status, "ACTIVE")))
        .orderBy(desc(grants.createdAt));

      // Query active vault credentials and session leases
      userGrantsWithVault = await Promise.all(
        userGrants.map(async (g) => {
          const [cred] = await db
            .select()
            .from(vaultCredentials)
            .where(
              and(
                eq(vaultCredentials.resourceName, g.resourceName),
                eq(vaultCredentials.status, "ACTIVE")
              )
            )
            .limit(1);

          if (!cred) {
            return { ...g, vaultInfo: null };
          }

          const activeSlots = await getActiveLeaseCount(cred.id);
          const userLease = await getUserLease(cred.id, dbEmployee!.id);

          return {
            ...g,
            vaultInfo: {
              credentialId: cred.id,
              maxConcurrency: cred.maxConcurrency,
              activeSlots,
              hasActiveLease: userLease.hasActiveLease,
              remainingMinutes: userLease.remainingMinutes,
            },
          };
        })
      );

      // Query department information if assigned
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
      // Query pending access requests
      const pendingReqs = await db
        .select()
        .from(accessRequests)
        .where(
          and(
            eq(accessRequests.employeeId, dbEmployee.id),
            eq(accessRequests.status, "PENDING")
          )
        );
      pendingToolNames = new Set(pendingReqs.map((r) => r.resourceName));
    } catch (err: any) {
      console.error("[PostgreSQL] Error querying grants/department:", err);
    }
  }

  // Available catalog list
  const allCatalogTools = getAllResources();
  const grantedToolNames = new Set(userGrants.map((g) => g.resourceName));
  const availableToRequest = allCatalogTools.filter((t: ResourceInfo) => !grantedToolNames.has(t.name));

  // Count active sessions held by user
  const activeLeasesHeldCount = userGrantsWithVault.filter((g) => g.vaultInfo?.hasActiveLease).length;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* --------------------------------------------------------------------- */}
      {/* Notifications & Action Feedback Banners                               */}
      {/* --------------------------------------------------------------------- */}
      {searchParams.success === "grant_activated" && (
        <div className="p-4 rounded-2xl bg-mint-50 border border-mint-200 text-mint-900 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-mint-500 text-white flex items-center justify-center shrink-0 shadow-mint">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-xs sm:text-sm text-mint-900">
                Đã kích hoạt quyền thành công!
              </p>
              <p className="text-xs text-mint-700 mt-0.5">
                Công cụ <strong>{searchParams.tool || "AI Tool"}</strong> đã được tự động thêm vào danh sách công cụ được cấp quyền của bạn (Quyền Quản Trị Viên).
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="text-xs text-mint-700 hover:text-mint-900 font-medium underline underline-offset-2 shrink-0 ml-2"
          >
            Đóng
          </Link>
        </div>
      )}

      {searchParams.success === "request_submitted" && (
        <div className="p-4 rounded-2xl bg-mint-50 border border-mint-200 text-mint-900 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-mint-500 text-white flex items-center justify-center shrink-0 shadow-mint">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-xs sm:text-sm text-mint-900">
                Đã gửi yêu cầu cấp quyền thành công!
              </p>
              <p className="text-xs text-mint-700 mt-0.5">
                Yêu cầu dùng công cụ <strong>{searchParams.tool || "AI Tool"}</strong> đã được chuyển tới Quản trị viên để phê duyệt.
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="text-xs text-mint-700 hover:text-mint-900 font-medium underline underline-offset-2 shrink-0 ml-2"
          >
            Đóng
          </Link>
        </div>
      )}

      {searchParams.error === "rate_limited" && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="text-xs sm:text-sm">
            <p className="font-semibold text-amber-900">Thao tác hơi nhanh</p>
            <p className="text-amber-800/80 text-xs mt-0.5">
              Hệ thống tạm dừng một chút để đảm bảo an toàn. Bạn vui lòng thử lại sau 30 giây nhé.
            </p>
          </div>
        </div>
      )}

      {searchParams.error === "concurrency_limit_exceeded" && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-3 shadow-sm">
          <Users className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="text-xs sm:text-sm">
            <p className="font-semibold text-amber-900">Công cụ đang có đủ người dùng</p>
            <p className="text-amber-800/80 text-xs mt-0.5">
              Dịch vụ <strong>{searchParams.tool || "AI Tool"}</strong> hiện đã hết ghế trống. Bạn vui lòng quay lại sau ít phút khi đồng nghiệp trả phiên nhé.
            </p>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* CASE 1: USER IS NOT AUTHENTICATED (Sign In Hero View)                  */}
      {/* --------------------------------------------------------------------- */}
      {!session?.user ? (
        <div className="space-y-12 my-6">
          {/* Main Hero Card */}
          <div className="card-cream p-8 sm:p-12 text-center space-y-6 relative overflow-hidden bg-white">
            <div className="w-16 h-16 rounded-2xl bg-mint-50 border border-mint-200 text-mint-600 flex items-center justify-center mx-auto shadow-sm">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <div className="max-w-2xl mx-auto space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-mint-100 text-mint-800 border border-mint-200">
                <Sparkles className="w-3.5 h-3.5 text-mint-600" />
                <span>Cổng Công Cụ AI Doanh Nghiệp</span>
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-ink-900 tracking-tight leading-tight">
                Làm Việc Nhanh Hơn Với AI Bản Quyền
              </h1>
              <p className="text-sm sm:text-base text-ink-600 leading-relaxed max-w-xl mx-auto">
                Đăng nhập bằng tài khoản Google công ty để sử dụng ChatGPT Plus, Claude, Gemini và Cursor được phê duyệt.
              </p>
            </div>

            {/* Google OAuth Login Button */}
            <div className="pt-2 max-w-sm mx-auto space-y-3">
              <form
                action={async () => {
                  "use server";
                  const headerList = headers();
                  const clientIp = headerList.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
                  const limitResult = await checkLoginRateLimit(clientIp);
                  if (!limitResult.success) {
                    redirect("/?error=rate_limited");
                  }
                  await signIn("google", { redirectTo: "/" });
                }}
              >
                <button
                  type="submit"
                  className="w-full py-3 px-5 rounded-xl bg-white hover:bg-cream-100 text-ink-800 font-semibold text-sm border border-cream-300 shadow-cream hover:shadow-cream-hover flex items-center justify-center gap-3 transition-all active:scale-[0.99] group"
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
                  <span>Đăng nhập với Google Workspace</span>
                  <ArrowRight className="w-4 h-4 text-ink-400 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </form>
              <p className="text-[11px] text-ink-400">
                Chỉ dành cho nhân viên có tài khoản email công ty.
              </p>
            </div>
          </div>

          {/* 3 Friendly Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="card-cream p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-mint-50 text-mint-600 flex items-center justify-center border border-mint-200">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-ink-900 text-sm">Mở Ứng Dụng Nhanh Chóng</h3>
              <p className="text-xs text-ink-600 leading-relaxed">
                Không cần nhớ mật khẩu hay nhập mã xác thực rườm rà. Bạn mở công cụ làm việc chỉ bằng một cú click chuột.
              </p>
            </div>

            <div className="card-cream p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cream-200 text-ink-700 flex items-center justify-center border border-cream-300">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-ink-900 text-sm">Chia Sẻ Ghế Thông Minh</h3>
              <p className="text-xs text-ink-600 leading-relaxed">
                Tài khoản bản quyền công ty được tự động chia sẻ chỗ ngồi nhịp nhàng, đảm bảo mọi người đều có công cụ sử dụng.
              </p>
            </div>

            <div className="card-cream p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-mint-50 text-mint-600 flex items-center justify-center border border-mint-200">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-ink-900 text-sm">Dễ Dàng Xin Cấp Quyền</h3>
              <p className="text-xs text-ink-600 leading-relaxed">
                Cần thêm công cụ mới cho dự án? Bạn chỉ cần bấm nút "Yêu cầu cấp quyền" để quản lý phê duyệt tức thì.
              </p>
            </div>
          </div>

          {/* Quick link to guide page */}
          <div className="text-center pt-2">
            <Link
              href="/he-thong"
              className="inline-flex items-center gap-1.5 text-xs text-mint-700 hover:text-mint-800 font-medium underline underline-offset-4"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Tìm hiểu chi tiết cơ chế hoạt động của nền tảng tại đây</span>
            </Link>
          </div>
        </div>
      ) : (
        /* --------------------------------------------------------------------- */
        /* CASE 2: AUTHENTICATED EMPLOYEE / ADMIN WORKSPACE                     */
        /* --------------------------------------------------------------------- */
        <div className="space-y-8">
          {/* Executive Employee Header Card */}
          <div className="card-cream p-6 sm:p-8 bg-white">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              {/* User Identity Details */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  {dbEmployee?.avatarUrl ? (
                    <img
                      src={dbEmployee.avatarUrl}
                      alt={dbEmployee.name || session?.user?.name || "User"}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-mint-200 shadow-sm"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-mint-500 text-white flex items-center justify-center font-bold text-xl shadow-mint">
                      {(dbEmployee?.name || session?.user?.name || "U")[0].toUpperCase()}
                    </div>
                  )}
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-mint-500 border-2 border-white" title="Trực tuyến" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-bold text-ink-900 tracking-tight">
                      {dbEmployee?.name || session?.user?.name || "Nhân viên"}
                    </h1>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border ${
                        dbEmployee?.role === "ROOT_ADMIN"
                          ? "bg-amber-100 text-amber-800 border-amber-300"
                          : "bg-mint-100 text-mint-800 border-mint-200"
                      }`}
                    >
                      {dbEmployee?.role === "ROOT_ADMIN" ? "Quản Trị Viên" : "Thành Viên"}
                    </span>
                  </div>

                  <p className="text-xs text-ink-500 font-mono">
                    {dbEmployee?.email || session?.user?.email}
                  </p>

                  <div className="flex items-center gap-2 pt-1 text-xs text-ink-600">
                    <Building2 className="w-3.5 h-3.5 text-mint-600" />
                    <span>
                      Phòng ban:{" "}
                      <strong className="text-ink-800 font-medium">
                        {employeeDept ? `${employeeDept.name} (${employeeDept.code})` : "Chưa phân bổ"}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions & Logout */}
              <div className="flex items-center gap-2 flex-wrap self-stretch md:self-auto justify-end">
                {dbEmployee?.role === "ROOT_ADMIN" && (
                  <Link
                    href="/admin"
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Cổng Quản Trị</span>
                  </Link>
                )}

                <Link
                  href="/he-thong"
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-cream-100 text-ink-700 border border-cream-300 transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5 text-mint-600" />
                  <span>Hướng Dẫn</span>
                </Link>

                <form
                  action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/" });
                  }}
                >
                  <button
                    type="submit"
                    className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center gap-1.5"
                    title="Đăng xuất khỏi hệ thống"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Đăng xuất</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Employee Stats Bar */}
            <div className="mt-6 pt-6 border-t border-cream-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="space-y-0.5">
                <span className="text-ink-500 text-[11px]">Công cụ khả dụng</span>
                <p className="text-lg font-bold text-ink-900 font-mono">
                  {userGrants.length} <span className="text-xs font-normal text-ink-500">dịch vụ</span>
                </p>
              </div>

              <div className="space-y-0.5">
                <span className="text-ink-500 text-[11px]">Đang sử dụng</span>
                <p className="text-lg font-bold text-mint-600 font-mono">
                  {activeLeasesHeldCount} <span className="text-xs font-normal text-ink-500">công cụ</span>
                </p>
              </div>

              <div className="space-y-0.5">
                <span className="text-ink-500 text-[11px]">Ngân sách phòng ban</span>
                <p className="text-lg font-bold text-ink-900 font-mono">
                  ${deptBudgetStats ? deptBudgetStats.monthlyBudgetUsd.toLocaleString() : "500"}
                  <span className="text-xs font-normal text-ink-500">/tháng</span>
                </p>
              </div>

              <div className="space-y-0.5">
                <span className="text-ink-500 text-[11px]">Đã tiêu hao</span>
                <p className="text-lg font-bold text-ink-700 font-mono">
                  ${deptBudgetStats ? deptBudgetStats.spentUsd.toFixed(2) : "0.00"}{" "}
                  <span className="text-[10px] text-mint-700 font-semibold bg-mint-50 px-1.5 py-0.5 rounded border border-mint-200">
                    {deptBudgetStats ? `${deptBudgetStats.percentageUsed}%` : "0%"}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* ----------------------------------------------------------------- */}
          {/* SECTION: ACTIVE AI WORKSPACE (Dịch vụ đã được cấp quyền)          */}
          {/* ----------------------------------------------------------------- */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-ink-900 flex items-center gap-2">
                  <Compass className="w-5 h-5 text-mint-600" />
                  Công Cụ Được Cấp Quyền Của Bạn
                </h2>
                <p className="text-xs text-ink-500 mt-0.5">
                  Danh sách công cụ AI bạn được phân quyền. Công cụ gắn nhãn SẴN SÀNG đã kết nối tài khoản bản quyền, nhãn CHỜ KẾT NỐI đang chờ nạp tài khoản vào Kho Mật Mã.
                </p>
              </div>
              <span className="text-xs font-mono text-mint-800 bg-mint-50 px-3 py-1 rounded-full border border-mint-200 font-semibold">
                {userGrants.length} công cụ
              </span>
            </div>

            {userGrants.length === 0 ? (
              /* High-end Guided Onboarding State */
              <div className="card-cream p-8 sm:p-10 text-center space-y-4 bg-white">
                <div className="w-14 h-14 rounded-2xl bg-mint-50 text-mint-600 flex items-center justify-center mx-auto border border-mint-200 shadow-sm">
                  <Sparkles className="w-7 h-7" />
                </div>
                <div className="max-w-md mx-auto space-y-2">
                  <h3 className="text-base font-bold text-ink-900">
                    Bạn chưa có quyền sử dụng công cụ AI nào
                  </h3>
                  <p className="text-xs text-ink-600 leading-relaxed">
                    Tài khoản của bạn đã được kết nối an toàn. Hãy chọn công cụ bạn muốn sử dụng từ <strong>Danh mục bên dưới</strong> và bấm <strong>"Yêu cầu cấp quyền"</strong> để quản trị viên phê duyệt nhé.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userGrantsWithVault.map((grant) => {
                  const details = getResourceDetails(grant.resourceName);
                  const vaultInfo = grant.vaultInfo;
                  const isVaultConfigured = !!vaultInfo;
                  const isSeatFull = isVaultConfigured && vaultInfo.activeSlots >= vaultInfo.maxConcurrency;

                  return (
                    <div
                      key={grant.id}
                      className="card-cream card-cream-hover p-6 flex flex-col justify-between space-y-4 group relative bg-white"
                    >
                      <div className="space-y-3">
                        {/* Header: Tool Name, Provider & Status Badge */}
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-mint-500 shrink-0" />
                              <h3 className="font-bold text-base text-ink-900 group-hover:text-mint-700 transition-colors">
                                {grant.resourceName}
                              </h3>
                            </div>
                            <p className="text-xs text-ink-500 mt-0.5">
                              Cung cấp bởi <span className="text-ink-800 font-semibold">{details.provider}</span>
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {isVaultConfigured ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-mint-50 text-mint-700 border border-mint-200">
                                SẴN SÀNG
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                CHỜ KẾT NỐI
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-ink-600 leading-relaxed line-clamp-2">
                          {details.description}
                        </p>

                        {/* Shared Vault Lease Mutex Indicator / Unconfigured Notice */}
                        {isVaultConfigured ? (
                          <div className="p-3 rounded-xl bg-cream-50 border border-cream-200 space-y-2">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-ink-600 flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-mint-600" />
                                Tình trạng ghế:
                              </span>
                              <span className={isSeatFull ? "text-amber-700 font-semibold" : "text-mint-700 font-semibold"}>
                                {vaultInfo.activeSlots} / {vaultInfo.maxConcurrency} người đang dùng
                              </span>
                            </div>

                            {/* Active Lease Badge & Release Action */}
                            {vaultInfo.hasActiveLease && (
                              <div className="flex items-center justify-between p-2 rounded-lg bg-mint-100/70 border border-mint-200 text-mint-900 text-xs">
                                <span className="flex items-center gap-1.5 font-medium">
                                  <span className="w-2 h-2 rounded-full bg-mint-500 animate-pulse" />
                                  <span>Đang mở phiên: ~{vaultInfo.remainingMinutes} phút còn lại</span>
                                </span>
                                <form action={handleReleaseSession}>
                                  <input type="hidden" name="credentialId" value={vaultInfo.credentialId} />
                                  <button
                                    type="submit"
                                    className="px-2.5 py-1 rounded-md bg-white hover:bg-cream-100 text-mint-800 text-[11px] font-semibold border border-mint-300 shadow-sm transition-colors"
                                  >
                                    Trả lại chỗ
                                  </button>
                                </form>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 space-y-1">
                            <div className="flex items-center gap-1.5 font-semibold text-[11px]">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>Chưa kết nối tài khoản bản quyền</span>
                            </div>
                            <p className="text-[11px] text-amber-800/80 leading-relaxed">
                              Quản trị viên cần nạp tài khoản doanh nghiệp vào Kho Mật Mã (Vault) để nhân viên có thể sử dụng.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Launch Button or Admin Config Shortcut */}
                      <div className="pt-2">
                        {isVaultConfigured ? (
                          <a
                            href={`/api/launch/${grant.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white transition-all shadow-sm active:scale-[0.99] ${
                              isSeatFull && !vaultInfo?.hasActiveLease
                                ? "bg-ink-400 hover:bg-ink-500 cursor-not-allowed"
                                : "bg-mint-600 hover:bg-mint-500 shadow-mint"
                            }`}
                          >
                            <span>{isSeatFull && !vaultInfo?.hasActiveLease ? "Đang bận • Thử lại sau" : "Mở Công Cụ Ngay"}</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ) : dbEmployee?.role === "ROOT_ADMIN" ? (
                          <Link
                            href="/admin"
                            className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white transition-all shadow-sm"
                          >
                            <span>Nạp Tài Khoản Vào Vault</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        ) : (
                          <button
                            disabled
                            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-cream-200 text-ink-400 cursor-not-allowed flex items-center justify-center gap-2 border border-cream-300"
                            title="Chờ Quản trị viên kết nối tài khoản bản quyền"
                          >
                            <span>Chờ Admin Kích Hoạt</span>
                            <Clock className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ----------------------------------------------------------------- */}
          {/* SECTION: ENTERPRISE AI CATALOG & SELF-SERVICE ACCESS REQUEST       */}
          {/* ----------------------------------------------------------------- */}
          {availableToRequest.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-cream-300">
              <div>
                <h2 className="text-lg font-bold text-ink-900 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-mint-600" />
                  Danh Mục Công Cụ AI Khả Dụng
                </h2>
                <p className="text-xs text-ink-500 mt-0.5">
                  {dbEmployee?.role === "ROOT_ADMIN"
                    ? "Với vai trò Quản Trị Viên, bạn có thể tự kích hoạt quyền ngay lập tức cho mình hoặc vào Cổng Quản Trị để phân bổ cho toàn công ty."
                    : "Bạn có thể bấm \"Yêu Cầu Cấp Quyền\" đối với các công cụ phục vụ công việc của mình."}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableToRequest.map((tool: ResourceInfo) => (
                  <div
                    key={tool.name}
                    className="card-cream p-5 flex flex-col justify-between space-y-4 bg-white"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-sm text-ink-900 leading-snug">{tool.name}</h4>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cream-200 text-ink-700">
                          {tool.category}
                        </span>
                      </div>
                      <p className="text-xs text-ink-500 mt-0.5">Cung cấp bởi {tool.provider}</p>
                      <p className="text-xs text-ink-600 leading-relaxed line-clamp-2">{tool.description}</p>
                    </div>

                    {dbEmployee?.role === "ROOT_ADMIN" ? (
                      <form action={handleRequestAccess} className="pt-2">
                        <input type="hidden" name="resourceName" value={tool.name} />
                        <button
                          type="submit"
                          className="w-full py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold border border-amber-300 shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-[0.99]"
                          title="Tự động cấp quyền sử dụng cho tài khoản Quản trị viên"
                        >
                          <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                          <span>Kích Hoạt Cho Tôi</span>
                        </button>
                      </form>
                    ) : pendingToolNames.has(tool.name) ? (
                      <div className="pt-2">
                        <div
                          className="w-full py-2 px-3 rounded-xl bg-amber-50/90 text-amber-800 text-xs font-semibold border border-amber-200 shadow-sm flex items-center justify-center gap-1.5 cursor-default"
                          title="Yêu cầu của bạn đang chờ Quản trị viên phê duyệt"
                        >
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Đang Chờ Quản Trị Duyệt</span>
                        </div>
                      </div>
                    ) : (
                      <form action={handleRequestAccess} className="pt-2">
                        <input type="hidden" name="resourceName" value={tool.name} />
                        <button
                          type="submit"
                          className="w-full py-2 px-3 rounded-xl bg-white hover:bg-cream-100 text-mint-800 text-xs font-semibold border border-mint-300 shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-[0.99]"
                        >
                          <Send className="w-3.5 h-3.5 text-mint-600" />
                          <span>Yêu Cầu Cấp Quyền</span>
                        </button>
                      </form>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
