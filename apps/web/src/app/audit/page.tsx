import React from "react";
import Link from "next/link";
import { db, auditLogs } from "@/db";
import { desc } from "drizzle-orm";
import {
  FileText,
  ArrowLeft,
  Clock,
  User,
  Activity,
  Database,
  CheckCircle,
  AlertCircle,
  Code,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  let logs: any[] = [];
  let dbError: string | null = null;

  try {
    logs = await db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(50);
  } catch (err: any) {
    console.error("[PostgreSQL] Failed to query audit_logs:", err);
    dbError = err?.message || "Failed to load audit logs from database";
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
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
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <FileText className="w-6 h-6 text-indigo-400" />
              Bảng Nhật ký Kiểm toán (Audit Logs)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 pl-8">
            Dữ liệu append-only được truy vấn trực tiếp từ bảng <code>audit_logs</code> trong PostgreSQL.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
          <Database className="w-3.5 h-3.5" />
          <span>{logs.length} bản ghi gần nhất</span>
        </div>
      </div>

      {/* Database Error Banner */}
      {dbError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <div>
            <p className="font-semibold">Lỗi truy vấn cơ sở dữ liệu</p>
            <p className="text-rose-300/80 mt-0.5">{dbError}</p>
          </div>
        </div>
      )}

      {/* Audit Logs Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-mono">
              <tr>
                <th className="py-3.5 px-4">Thời gian</th>
                <th className="py-3.5 px-4">Hành động</th>
                <th className="py-3.5 px-4">Actor ID</th>
                <th className="py-3.5 px-4">Target ID</th>
                <th className="py-3.5 px-4">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <Clock className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    Chưa có bản ghi kiểm toán nào được ghi nhận trong cơ sở dữ liệu.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    {/* Timestamp */}
                    <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
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
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <Activity className="w-3 h-3" />
                        {log.action}
                      </span>
                    </td>

                    {/* Actor ID */}
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      <span className="text-slate-300" title={log.actorId}>
                        {log.actorId ? `${log.actorId.slice(0, 8)}...` : "SYSTEM"}
                      </span>
                    </td>

                    {/* Target ID */}
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      <span className="text-slate-300" title={log.targetId}>
                        {log.targetId ? `${log.targetId.slice(0, 8)}...` : "—"}
                      </span>
                    </td>

                    {/* Metadata JSON */}
                    <td className="py-3 px-4">
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
  );
}
