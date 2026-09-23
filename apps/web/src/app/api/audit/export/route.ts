import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, auditLogs } from "@/db";
import { desc, eq } from "drizzle-orm";
import { verifyAuditIntegrity } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await auth();

  // 1. Authentication Check
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isRootAdmin = session.user.role === "ROOT_ADMIN";
  const searchParams = request.nextUrl.searchParams;
  const format = searchParams.get("format") || "json";

  try {
    // 2. Fetch Audit Logs (Root Admin gets all records, Employees get their own actions)
    let logs;
    if (isRootAdmin) {
      logs = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(1000);
    } else {
      logs = await db
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.actorId, session.user.id))
        .orderBy(desc(auditLogs.createdAt))
        .limit(500);
    }

    const todayStr = new Date().toISOString().slice(0, 10);

    // 3. Format: CSV (RFC 4180 Compliant)
    if (format === "csv") {
      const headers = ["ID", "Timestamp (UTC)", "Actor ID", "Action", "Target ID", "Checksum (SHA-256)", "Metadata (JSON)"];
      
      const escapeCsvField = (val: unknown): string => {
        if (val === null || val === undefined) return "";
        const str = typeof val === "object" ? JSON.stringify(val) : String(val);
        if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const rows = logs.map((log) => [
        escapeCsvField(log.id),
        escapeCsvField(log.createdAt ? new Date(log.createdAt).toISOString() : ""),
        escapeCsvField(log.actorId),
        escapeCsvField(log.action),
        escapeCsvField(log.targetId),
        escapeCsvField(log.checksum || "LEGACY_UNSIGNED"),
        escapeCsvField(log.metadata),
      ]);

      const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="audit-compliance-${todayStr}.csv"`,
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      });
    }

    // 4. Format: JSON (ISO 27001 / SOC 2 Compliance Verification Package)
    const integrityReport = await verifyAuditIntegrity();

    const compliancePackage = {
      complianceMetadata: {
        title: "Enterprise AI Access Management System - Audit Compliance Package",
        standard: "ISO/IEC 27001:2022 & SOC 2 Type II Trust Services Criteria",
        exportTimestamp: new Date().toISOString(),
        exportedBy: session.user.email,
        actorRole: session.user.role,
        wormProtection: {
          status: "ENFORCED",
          mechanism: "PostgreSQL Database Trigger (trg_audit_logs_immutable)",
          policy: "Write-Once-Read-Many (WORM) — All UPDATE and DELETE operations blocked at database level",
        },
        integrityVerification: integrityReport,
      },
      summary: {
        totalExportedRecords: logs.length,
        timeframe: {
          earliestRecord: logs.length > 0 ? logs[logs.length - 1].createdAt : null,
          latestRecord: logs.length > 0 ? logs[0].createdAt : null,
        },
      },
      auditLogs: logs,
    };

    return new NextResponse(JSON.stringify(compliancePackage, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="compliance-package-${todayStr}.json"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("[Compliance Export Error]:", error);
    return NextResponse.json(
      { error: "Failed to export compliance logs", details: error?.message },
      { status: 500 }
    );
  }
}
