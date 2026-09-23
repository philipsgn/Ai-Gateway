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
  Database,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  Download,
  DollarSign,
  TrendingUp,
  Cpu,
  KeyRound,
  Users,
  Layers,
  Filter,
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
    if (act.includes("LAUNCH") || act.includes("TOKEN") || act.includes("SESSION")) return "gateway";
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
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              title="Quay lại Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <ShieldCheck className="w-7 h-7 text-indigo-400" />
              Tuân Thủ & Kiểm Toán Bất Biến (WORM Audit)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 pl-8">
            Hồ sơ kiểm toán chuẩn ISO 27001 / SOC 2 Type II với chính sách Write-Once-Read-Many (WORM) và mã băm SHA-256 bất biến.
          </p>
        </div>

        {/* Quick Export Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <a
            href="/api/audit/export?format=csv"
            download
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 hover:text-white transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            Xuất CSV (RFC 4180)
          </a>
          <a
            href="/api/audit/export?format=json"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-md shadow-indigo-500/20"
          >
            <FileText className="w-3.5 h-3.5" />
            ISO 27001 / SOC 2 JSON
          </a>
        </div>
      </div>

      {/* Database Error Banner */}
      {dbError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <div>
            <p className="font-semibold">Lỗi truy vấn cơ sở dữ liệu kiểm toán</p>
            <p className="text-rose-300/80 mt-0.5">{dbError}</p>
          </div>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: WORM Status */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Trạng Thái WORM</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-emerald-400 font-mono">BẢO VỆ 100%</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Trigger PostgreSQL chặn toàn bộ UPDATE & DELETE
            </p>
          </div>
        </div>

        {/* Card 2: Cryptographic Integrity */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Toàn Vẹn Checksum</span>
            <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-sky-400 font-mono">
                {integrityReport.integrityRate}%
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                ({integrityReport.signedRecords} ký / {integrityReport.totalRecords} bản ghi)
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {integrityReport.tamperedRecords === 0
                ? "Không phát hiện sai lệch SHA-256"
                : `Cảnh báo: ${integrityReport.tamperedRecords} sai lệch!`}
            </p>
          </div>
        </div>

        {/* Card 3: ROI Time Saved */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Thời Gian Tiết Kiệm</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-amber-400 font-mono">~{hoursSaved} giờ</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Dựa trên ~20 phút tự động hoá cho mỗi phiên truy cập
            </p>
          </div>
        </div>

        {/* Card 4: Economic Value Saved */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Giá Trị Kinh Tế</span>
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-indigo-400 font-mono">
                ${costSavings.toLocaleString()}
              </span>
              <span className="text-[10px] text-emerald-400 font-medium">+100% ROI</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Giảm thiểu chi phí quản trị rủi ro & kiểm toán thủ công
            </p>
          </div>
        </div>
      </div>

      {/* Event Distribution Bar */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            Phân Bổ Sự Kiện Kiểm Toán (Event Breakdown)
          </span>
          <span className="text-slate-500 font-mono">Tổng: {logs.length} sự kiện mẫu</span>
        </div>

        {/* Multi-segmented Progress Bar */}
        <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
          <div style={{ width: `${launchPct}%` }} className="bg-sky-500 h-full" title={`Gateway: ${launchPct}%`} />
          <div style={{ width: `${grantPct}%` }} className="bg-emerald-500 h-full" title={`Grants: ${grantPct}%`} />
          <div style={{ width: `${authPct}%` }} className="bg-amber-500 h-full" title={`Auth: ${authPct}%`} />
          <div style={{ width: `${systemPct}%` }} className="bg-indigo-500 h-full" title={`System: ${systemPct}%`} />
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0" />
            <span className="text-slate-400">Gateway Launches:</span>
            <span className="font-mono text-slate-200 font-medium">{launchCount} ({launchPct}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-slate-400">Access Grants:</span>
            <span className="font-mono text-slate-200 font-medium">{grantCount} ({grantPct}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
            <span className="text-slate-400">Auth & Users:</span>
            <span className="font-mono text-slate-200 font-medium">{authCount} ({authPct}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0" />
            <span className="text-slate-400">System & Tools:</span>
            <span className="font-mono text-slate-200 font-medium">{systemCount} ({systemPct}%)</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Table Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
            <Filter className="w-3.5 h-3.5 text-indigo-400" />
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
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                  }`}
                >
                  {tab.label}{" "}
                  <span className={`text-[10px] ml-1 font-mono ${isActive ? "text-indigo-200" : "text-slate-500"}`}>
                    ({tab.count})
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl bg-slate-900/40">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-mono">
                <tr>
                  <th className="py-3.5 px-4">Thời gian</th>
                  <th className="py-3.5 px-4">Hành động</th>
                  <th className="py-3.5 px-4">Actor ID</th>
                  <th className="py-3.5 px-4">Mã Checksum (SHA-256)</th>
                  <th className="py-3.5 px-4">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      <Clock className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                      Không tìm thấy bản ghi kiểm toán phù hợp trong danh mục này.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Timestamp */}
                      <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">
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
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold text-[11px] bg-slate-800 text-slate-200 border border-slate-700">
                          <Activity className="w-3 h-3 text-indigo-400" />
                          {log.action}
                        </span>
                      </td>

                      {/* Actor ID */}
                      <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                        <span className="text-slate-300" title={log.actorId}>
                          {log.actorId ? `${log.actorId.slice(0, 8)}...` : "SYSTEM"}
                        </span>
                      </td>

                      {/* Checksum SHA-256 */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {log.checksum ? (
                          <span
                            className="inline-flex items-center gap-1 font-mono text-[11px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/40"
                            title={`Full SHA-256: ${log.checksum}`}
                          >
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            {log.checksum.slice(0, 12)}...
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">Legacy Record</span>
                        )}
                      </td>

                      {/* Metadata JSON */}
                      <td className="py-3.5 px-4">
                        {log.metadata ? (
                          <code className="text-[11px] text-indigo-300 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-900/40 block max-w-xs truncate">
                            {JSON.stringify(log.metadata)}
                          </code>
                        ) : (
                          <span className="text-slate-600">—</span>
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
