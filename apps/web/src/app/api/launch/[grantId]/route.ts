import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, grants, auditLogs, employees } from "@/db";
import { eq, sql } from "drizzle-orm";
import { getResourceDetails } from "@/lib/catalog";
import { getDepartmentBudgetStats } from "@/lib/budget";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { grantId: string } }
) {
  const session = await auth();

  // 1. Must be authenticated
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/?error=unauthorized", request.url));
  }

  const { grantId } = params;
  if (!grantId) {
    return NextResponse.redirect(new URL("/?error=invalid_grant", request.url));
  }

  try {
    // 2. Fetch grant from database
    const [grant] = await db
      .select()
      .from(grants)
      .where(eq(grants.id, grantId))
      .limit(1);

    if (!grant) {
      return NextResponse.redirect(new URL("/?error=grant_not_found", request.url));
    }

    // 3. Security Check: Ownership (must be own grant or Root Admin)
    const isOwner = grant.employeeId === session.user.id;
    const isRootAdmin = session.user.role === "ROOT_ADMIN";
    if (!isOwner && !isRootAdmin) {
      return NextResponse.redirect(new URL("/?error=forbidden", request.url));
    }

    // 4. Security Check: Status must be ACTIVE
    if (grant.status !== "ACTIVE") {
      return NextResponse.redirect(new URL("/?error=grant_revoked", request.url));
    }

    // 5. Security Check: Expiration
    if (grant.expiresAt && new Date(grant.expiresAt).getTime() < Date.now()) {
      return NextResponse.redirect(new URL("/?error=grant_expired", request.url));
    }

    // 6. Update usage count and timestamp
    await db
      .update(grants)
      .set({
        accessCount: sql`${grants.accessCount} + 1`,
        lastAccessedAt: new Date(),
      })
      .where(eq(grants.id, grant.id));

    // 7. Append audit log
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
    const resourceInfo = getResourceDetails(grant.resourceName);

    await db.insert(auditLogs).values({
      actorId: session.user.id,
      action: "AI_SERVICE_LAUNCHED",
      targetId: grant.id,
      metadata: {
        resourceName: grant.resourceName,
        employeeEmail: session.user.email,
        targetUrl: resourceInfo.officialUrl,
        clientIp,
        estimatedCostUsd: resourceInfo.costPerLaunch,
      },
    });

    // 8. Check Department Budget & Alert if threshold crossed
    try {
      const [emp] = await db
        .select({ departmentId: employees.departmentId })
        .from(employees)
        .where(eq(employees.id, grant.employeeId))
        .limit(1);

      if (emp?.departmentId) {
        const budgetStats = await getDepartmentBudgetStats(emp.departmentId);
        if (budgetStats && (budgetStats.status === "WARNING" || budgetStats.status === "EXCEEDED")) {
          await db.insert(auditLogs).values({
            actorId: session.user.id,
            action: "BUDGET_THRESHOLD_ALERT",
            targetId: emp.departmentId,
            metadata: {
              departmentName: budgetStats.name,
              departmentCode: budgetStats.code,
              status: budgetStats.status,
              percentageUsed: budgetStats.percentageUsed,
              spentUsd: budgetStats.spentUsd,
              monthlyBudgetUsd: budgetStats.monthlyBudgetUsd,
              triggeredByLaunch: grant.resourceName,
            },
          });
        }
      }
    } catch (budgetErr) {
      console.error("[Budget Alert Error]:", budgetErr);
    }

    // 9. Safe redirect to official resource URL
    return NextResponse.redirect(resourceInfo.officialUrl, { status: 307 });
  } catch (error) {
    console.error("[Launch Gateway Error]:", error);
    return NextResponse.redirect(new URL("/?error=launch_failed", request.url));
  }
}
