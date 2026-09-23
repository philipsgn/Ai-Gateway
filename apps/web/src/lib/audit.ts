import crypto from "node:crypto";
import { db, auditLogs } from "../db";

export interface LogAuditParams {
  actorId?: string | null;
  action: string;
  targetId?: string | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Computes deterministic cryptographic SHA-256 checksum for audit record non-repudiation
 */
export function computeAuditChecksum(
  actorId: string | null | undefined,
  action: string,
  targetId: string | null | undefined,
  metadata: Record<string, unknown> | null | undefined,
  createdAt: Date | string
): string {
  const dateStr = typeof createdAt === "string" ? createdAt : createdAt.toISOString();
  // Sort keys in metadata for stable deterministic hashing
  let metadataStr = "{}";
  if (metadata && typeof metadata === "object") {
    const sortedKeys = Object.keys(metadata).sort();
    const sortedObj: Record<string, unknown> = {};
    for (const k of sortedKeys) {
      sortedObj[k] = metadata[k];
    }
    metadataStr = JSON.stringify(sortedObj);
  }

  const rawPayload = `${actorId || "SYSTEM"}|${action}|${targetId || "NONE"}|${metadataStr}|${dateStr}`;
  return crypto.createHash("sha256").update(rawPayload).digest("hex");
}

/**
 * Appends an immutable audit log record to Neon PostgreSQL with cryptographic checksum
 */
export async function logAuditEvent({
  actorId,
  action,
  targetId,
  metadata,
}: LogAuditParams) {
  const createdAt = new Date();
  const checksum = computeAuditChecksum(actorId, action, targetId, metadata, createdAt);

  const [inserted] = await db
    .insert(auditLogs)
    .values({
      actorId: actorId || null,
      action,
      targetId: targetId || null,
      metadata: metadata || null,
      checksum,
      createdAt,
    })
    .returning();

  return inserted;
}

export interface AuditIntegrityReport {
  totalRecords: number;
  signedRecords: number;
  legacyRecords: number;
  tamperedRecords: number;
  integrityRate: number;
  isWormCompliant: boolean;
}

/**
 * Validates the cryptographic checksums of audit records to prove non-tampering
 */
export async function verifyAuditIntegrity(): Promise<AuditIntegrityReport> {
  const records = await db.select().from(auditLogs);
  let signedRecords = 0;
  let legacyRecords = 0;
  let tamperedRecords = 0;

  for (const record of records) {
    if (!record.checksum) {
      legacyRecords++;
      continue;
    }

    signedRecords++;
    const expectedChecksum = computeAuditChecksum(
      record.actorId,
      record.action,
      record.targetId,
      record.metadata,
      record.createdAt
    );

    if (record.checksum !== expectedChecksum) {
      tamperedRecords++;
    }
  }

  const verifiedRecords = signedRecords - tamperedRecords;
  const integrityRate = signedRecords > 0 ? (verifiedRecords / signedRecords) * 100 : 100;

  return {
    totalRecords: records.length,
    signedRecords,
    legacyRecords,
    tamperedRecords,
    integrityRate: Math.round(integrityRate * 10) / 10,
    isWormCompliant: tamperedRecords === 0,
  };
}
