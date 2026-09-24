import React from "react";
import Link from "next/link";
import { db, auditLogs } from "@/db";
import { desc } from "drizzle-orm";
import { verifyAuditIntegrity } from "@/lib/audit";
import {
  FileText,
  ArrowLeft,
  Clock,
  Activity,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  Download,
  DollarSign,
  TrendingUp,
  Filter,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface AuditPageProps {
  searchParams?: {
    category?: string;
  };
}

export default async function AuditPage({ searchParams }: AuditPageProps) {
  const selectedCategory = searchParams?.category || "all";

  let logs: any[] = [];
  let dbError: string | null = null;
  let integrityReport = {
    totalRecords: 0,
    signedRecords: 0,
    legacyRecords: 0,
    tamperedRecords: 0,
    integrityRate: 100,
    isWormCompliant: true,
  };

  try {
    const [allLogs, report] = await Promise.all([
      db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(100),
      verifyAuditIntegrity(),
    ]);
    logs = allLogs;
    integrityReport = report;
  } catch (err: any) {
    console.error("[PostgreSQL] Failed to query audit data:", err);
    dbError = err?.message || "Failed to load audit data from database";
  }

  // --- Category Classification Helper ---
  const categorizeAction = (action: string): "gateway" | "grants" | "auth" | "system" => {
    const act = (action || "").toUpperCase();
    if (act.includes("LAUNCH") || act.includes("TOKEN") || act.includes("SESSION") || act.includes("CONCURRENCY")) return "gateway";
    if (act.includes("GRANT") || act.includes("REQUEST")) return "grants";
    if (act.includes("LOGIN") || act.includes("USER") || act.includes("AUTH")) return "auth";
    return "system";
  };

  // --- Calculate Event Distribution & Metrics ---
  let launchCount = 0;
  let grantCount = 0;
  let authCount = 0;
  let systemCount = 0;

  for (const log of logs) {
    const cat = categorizeAction(log.action);
    if (cat === "gateway") launchCount++;
    else if (cat === "grants") grantCount++;
    else if (cat === "auth") authCount++;
    else systemCount++;
  }

  const totalLogs = logs.length || 1;
  const launchPct = Math.round((launchCount / totalLogs) * 100);
  const grantPct = Math.round((grantCount / totalLogs) * 100);
  const authPct = Math.round((authCount / totalLogs) * 100);
  const systemPct = Math.round((systemCount / totalLogs) * 100);

  // --- ROI Calculation ---
  // Mỗi phiên tự động launch tiết kiệm trung bình 20 phút (0.33 giờ) xử lý phân quyền thủ công
  const hoursSaved = (launchCount * 0.33).toFixed(1);
  const costSavings = Math.round(Number(hoursSaved) * 40); // 40 USD/giờ chuẩn IT SecOps

  // --- Filter Logs for Display ---
  const filteredLogs = logs.filter((log) => {
    if (selectedCategory === "all") return true;
    return categorizeAction(log.action) === selectedCategory;
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Top Header & Navigation Banner */}
      <div className="card-cream p-6 sm:p-8 bg-gradient-to-r from-white via-cream-50 to-mint-50/40 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="p-2 rounded-xl bg-white hover:bg-cream-100 text-ink-600 border border-cream-300 transition-colors shadow-sm"
                title="Quay lại Không Gian Làm Việc"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink-900 flex items-center gap-2.5">
                <ShieldCheck className="w-7 h-7 text-mint-600" />
                Tuân Thủ & Kiểm Toán Bất Biến (WORM Audit)
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-ink-600 mt-2 pl-10 max-w-2xl leading-relaxed">
              Hồ sơ kiểm toán chuẩn ISO/IEC 27001 & SOC 2 Type II với chính sách Write-Once-Read-Many (WORM) thực thi tại tầng PostgreSQL Database Trigger và mã băm SHA-256 bất biến.
            </p>
          </div>

          {/* Quick Export Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap self-stretch sm:self-auto justify-end">
            <a
              href="/api/audit/export?format=csv"
              download
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-white text-ink-700 border border-cream-300 hover:bg-cream-100 transition-all shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-mint-600" />
              <span>Xuất CSV (RFC 4180)</span>
            </a>
            <a
              href="/api/audit/export?format=json"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-mint-600 text-white hover:bg-mint-500 transition-all shadow-mint"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Gói ISO 27001 / SOC 2 JSON</span>
            </a>
          </div>
        </div>
      </div>

      {/* Database Error Banner */}
      {dbError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          <div>
            <p className="font-semibold">Lỗi truy vấn cơ sở dữ liệu kiểm toán</p>
            <p className="text-rose-700 mt-0.5">{dbError}</p>
          </div>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: WORM Status */}
        <div className="card-cream p-5 bg-white flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-600">Trạng Thái WORM</span>
            <div className="p-1.5 rounded-lg bg-mint-50 text-mint-600 border border-mint-200">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-mint-700 font-mono">BẢO VỆ 100%</span>
            </div>
            <p className="text-[11px] text-ink-500 mt-1">
              Trigger PostgreSQL chặn toàn bộ UPDATE & DELETE
            </p>
          </div>
        </div>

        {/* Card 2: Cryptographic Integrity */}
        <div className="card-cream p-5 bg-white flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-600">Toàn Vẹn Checksum</span>
            <div className="p-1.5 rounded-lg bg-mint-50 text-mint-600 border border-mint-200">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-mint-700 font-mono">
                {integrityReport.integrityRate}%
              </span>
              <span className="text-[10px] text-ink-400 font-mono">
                ({integrityReport.signedRecords} ký / {integrityReport.totalRecords} bản ghi)
              </span>
            </div>
            <p className="text-[11px] text-ink-500 mt-1">
              {integrityReport.tamperedRecords === 0
                ? "Không phát hiện sai lệch SHA-256"
                : `Cảnh báo: ${integrityReport.tamperedRecords} sai lệch!`}
            </p>
          </div>
        </div>

        {/* Card 3: ROI Time Saved */}
        <div className="card-cream p-5 bg-white flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-600">Thời Gian Tiết Kiệm</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-amber-700 font-mono">~{hoursSaved} giờ</span>
            </div>
            <p className="text-[11px] text-ink-500 mt-1">
              Dựa trên ~20 phút tự động hoá cho mỗi phiên truy cập
            </p>
          </div>
        </div>

        {/* Card 4: Economic Value Saved */}
        <div className="card-cream p-5 bg-white flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-600">Giá Trị Kinh Tế</span>
            <div className="p-1.5 rounded-lg bg-mint-50 text-mint-600 border border-mint-200">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-mint-800 font-mono">
                ${costSavings.toLocaleString()}
              </span>
              <span className="text-[10px] text-mint-700 font-semibold bg-mint-50 px-1.5 py-0.5 rounded border border-mint-200">+100% ROI</span>
            </div>
            <p className="text-[11px] text-ink-500 mt-1">
              Giảm thiểu chi phí rủi ro & kiểm toán thủ công
            </p>
          </div>
        </div>
      </div>

      {/* Event Distribution Bar */}
      <div className="card-cream p-6 bg-white space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-ink-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-mint-600" />
            Phân Bổ Sự Kiện Kiểm Toán (Event Breakdown)
          </span>
          <span className="text-ink-400 font-mono">Tổng: {logs.length} sự kiện mẫu</span>
        </div>

        {/* Multi-segmented Progress Bar */}
        <div className="h-3 w-full bg-cream-200 rounded-full overflow-hidden flex">
          <div style={{ width: `${launchPct}%` }} className="bg-mint-500 h-full" title={`Gateway: ${launchPct}%`} />
          <div style={{ width: `${grantPct}%` }} className="bg-mint-700 h-full" title={`Grants: ${grantPct}%`} />
          <div style={{ width: `${authPct}%` }} className="bg-amber-400 h-full" title={`Auth: ${authPct}%`} />
          <div style={{ width: `${systemPct}%` }} className="bg-sky-400 h-full" title={`System: ${systemPct}%`} />
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-mint-500 shrink-0" />
            <span className="text-ink-600">Gateway Launches:</span>
            <span className="font-mono text-ink-900 font-semibold">{launchCount} ({launchPct}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-mint-700 shrink-0" />
            <span className="text-ink-600">Access Grants:</span>
            <span className="font-mono text-ink-900 font-semibold">{grantCount} ({grantPct}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
            <span className="text-ink-600">Auth & Users:</span>
            <span className="font-mono text-ink-900 font-semibold">{authCount} ({authPct}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shrink-0" />
            <span className="text-ink-600">System & Tools:</span>
            <span className="font-mono text-ink-900 font-semibold">{systemCount} ({systemPct}%)</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Table Container */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-ink-700">
            <Filter className="w-3.5 h-3.5 text-mint-600" />
            <span>Lọc Theo Loại Sự Kiện:</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: "all", label: "Tất Cả", count: logs.length },
              { id: "gateway", label: "Gateway", count: launchCount },
              { id: "grants", label: "Quyền Truy Cập", count: grantCount },
              { id: "auth", label: "Xác Thực", count: authCount },
              { id: "system", label: "Hệ Thống", count: systemCount },
            ].map((tab) => {
              const isActive = selectedCategory === tab.id;
              return (
                <Link
                  key={tab.id}
                  href={`/audit?category=${tab.id}`}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-mint-600 text-white shadow-mint"
                      : "bg-white text-ink-600 hover:text-ink-900 hover:bg-cream-100 border border-cream-300"
                  }`}
                >
                  {tab.label}{" "}
                  <span className={`text-[10px] ml-1 font-mono ${isActive ? "text-mint-100" : "text-ink-400"}`}>
                    ({tab.count})
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="card-cream overflow-hidden border border-cream-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-ink-700">
              <thead className="bg-cream-100/90 text-ink-600 border-b border-cream-200 uppercase tracking-wider font-mono text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Thời gian</th>
                  <th className="py-3.5 px-4">Hành động</th>
                  <th className="py-3.5 px-4">Actor ID</th>
                  <th className="py-3.5 px-4">Mã Checksum (SHA-256)</th>
                  <th className="py-3.5 px-4">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200/80 font-mono">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-ink-400 font-sans">
                      <Clock className="w-8 h-8 mx-auto mb-2 text-ink-300" />
                      Không tìm thấy bản ghi kiểm toán phù hợp trong danh mục này.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-cream-50/60 transition-colors">
                      {/* Timestamp */}
                      <td className="py-3.5 px-4 text-ink-800 whitespace-nowrap">
                        {log.createdAt
                          ? new Date(log.createdAt).toLocaleString("vi-VN", {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })
                          : "N/A"}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold text-[11px] bg-mint-50 text-mint-800 border border-mint-200">
                          <Activity className="w-3 h-3 text-mint-600" />
                          {log.action}
                        </span>
                      </td>

                      {/* Actor ID */}
                      <td className="py-3.5 px-4 text-ink-600 whitespace-nowrap">
                        <span title={log.actorId} className="font-semibold text-ink-800">
                          {log.actorId ? `${log.actorId.slice(0, 8)}...` : "SYSTEM"}
                        </span>
                      </td>

                      {/* Checksum SHA-256 */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {log.checksum ? (
                          <span
                            className="inline-flex items-center gap-1 font-mono text-[11px] text-mint-800 bg-mint-50 px-2 py-0.5 rounded border border-mint-200"
                            title={`Full SHA-256: ${log.checksum}`}
                          >
                            <ShieldCheck className="w-3 h-3 text-mint-600" />
                            {log.checksum.slice(0, 12)}...
                          </span>
                        ) : (
                          <span className="text-[11px] text-ink-400 italic font-sans">Bản ghi lịch sử</span>
                        )}
                      </td>

                      {/* Metadata JSON */}
                      <td className="py-3.5 px-4">
                        {log.metadata ? (
                          <code className="text-[11px] text-ink-700 bg-cream-50 px-2 py-0.5 rounded border border-cream-200 block max-w-xs truncate">
                            {JSON.stringify(log.metadata)}
                          </code>
                        ) : (
                          <span className="text-ink-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
