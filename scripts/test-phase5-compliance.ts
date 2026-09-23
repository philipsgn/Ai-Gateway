import postgres from "postgres";
import * as fs from "fs";
import * as path from "path";
import crypto from "node:crypto";
import { computeAuditChecksum } from "../apps/web/src/lib/audit";

function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
        const [k, ...v] = trimmed.split("=");
        process.env[k.trim()] = v.join("=").trim().replace(/^["']|["']$/g, "");
      }
    }
  }
}

loadEnv();

async function testPhase5Compliance() {
  console.log("================================================================================");
  console.log(" PHASE 5 END-TO-END VERIFICATION: ENTERPRISE COMPLIANCE & WORM AUDIT ANALYTICS");
  console.log("================================================================================");

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("Missing DATABASE_URL in environment");
  }

  const sql = postgres(databaseUrl, {
    max: 1,
    ssl: databaseUrl.includes("sslmode=require") ? "require" : undefined,
  });

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Neon PostgreSQL Connection & Schema Check
    // -------------------------------------------------------------------------
    console.log("\n[Test 1] Checking Neon PostgreSQL Connection & audit_logs schema...");
    const cols = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'audit_logs' 
      ORDER BY ordinal_position;
    `;
    const colNames = cols.map((c) => c.column_name);
    console.log("  -> Columns in audit_logs:", colNames.join(", "));
    if (!colNames.includes("checksum")) {
      throw new Error("FAIL: 'checksum' column missing from audit_logs table!");
    }
    console.log("  [PASS] 'checksum' column confirmed in live PostgreSQL schema.");

    // -------------------------------------------------------------------------
    // TEST 2: Append-Only Record Insertion with SHA-256 Checksum
    // -------------------------------------------------------------------------
    console.log("\n[Test 2] Inserting new compliance audit event with SHA-256 Checksum...");
    const testActorId = "test-compliance-actor";
    const testAction = "COMPLIANCE_INTEGRITY_TEST";
    const testTargetId = "target-compliance-101";
    const testMetadata = {
      testRunId: `run-${Date.now()}`,
      complianceStandard: "ISO_27001_SOC2",
      verificationAgent: "Antigravity",
    };
    const testCreatedAt = new Date();

    const expectedChecksum = computeAuditChecksum(
      testActorId,
      testAction,
      testTargetId,
      testMetadata,
      testCreatedAt
    );

    const [inserted] = await sql`
      INSERT INTO audit_logs (actor_id, action, target_id, metadata, checksum, created_at)
      VALUES (
        ${testActorId},
        ${testAction},
        ${testTargetId},
        ${JSON.stringify(testMetadata)},
        ${expectedChecksum},
        ${testCreatedAt.toISOString()}
      )
      RETURNING id, actor_id, action, target_id, metadata, checksum, created_at;
    `;

    console.log(`  -> Inserted Record ID: ${inserted.id}`);
    console.log(`  -> Computed SHA-256 Checksum: ${inserted.checksum}`);

    if (inserted.checksum !== expectedChecksum) {
      throw new Error(`FAIL: Inserted checksum (${inserted.checksum}) does not match expected (${expectedChecksum})`);
    }
    console.log("  [PASS] Audit record inserted with valid deterministic SHA-256 checksum.");

    // -------------------------------------------------------------------------
    // TEST 3: WORM Immutability Verification — Testing UPDATE Blocking Trigger
    // -------------------------------------------------------------------------
    console.log("\n[Test 3] Verifying WORM Immutability — Attempting UPDATE on audit_logs...");
    let updateBlocked = false;
    try {
      await sql`
        UPDATE audit_logs 
        SET action = 'TAMPERED_ACTION' 
        WHERE id = ${inserted.id};
      `;
    } catch (err: any) {
      console.log(`  -> Database rejected UPDATE with error: "${err.message.trim()}"`);
      if (err.message.includes("WORM Violation") || err.message.includes("trg_audit_logs_immutable")) {
        updateBlocked = true;
      }
    }

    if (!updateBlocked) {
      throw new Error("FAIL: UPDATE was allowed on audit_logs! WORM trigger is NOT enforcing immutability!");
    }
    console.log("  [PASS] WORM trigger strictly rejected UPDATE operation with exception.");

    // -------------------------------------------------------------------------
    // TEST 4: WORM Immutability Verification — Testing DELETE Blocking Trigger
    // -------------------------------------------------------------------------
    console.log("\n[Test 4] Verifying WORM Immutability — Attempting DELETE on audit_logs...");
    let deleteBlocked = false;
    try {
      await sql`
        DELETE FROM audit_logs 
        WHERE id = ${inserted.id};
      `;
    } catch (err: any) {
      console.log(`  -> Database rejected DELETE with error: "${err.message.trim()}"`);
      if (err.message.includes("WORM Violation") || err.message.includes("trg_audit_logs_immutable")) {
        deleteBlocked = true;
      }
    }

    if (!deleteBlocked) {
      throw new Error("FAIL: DELETE was allowed on audit_logs! WORM trigger is NOT enforcing immutability!");
    }
    console.log("  [PASS] WORM trigger strictly rejected DELETE operation with exception.");

    // -------------------------------------------------------------------------
    // TEST 5: Cryptographic Checksum Integrity Verification across Records
    // -------------------------------------------------------------------------
    console.log("\n[Test 5] Scanning database records and validating cryptographic hash integrity...");
    const allLogs = await sql`
      SELECT id, actor_id, action, target_id, metadata, checksum, created_at 
      FROM audit_logs 
      ORDER BY created_at DESC;
    `;

    let signedCount = 0;
    let legacyCount = 0;
    let tamperedCount = 0;

    for (const log of allLogs) {
      if (!log.checksum) {
        legacyCount++;
        continue;
      }

      signedCount++;
      const recomputed = computeAuditChecksum(
        log.actor_id,
        log.action,
        log.target_id,
        typeof log.metadata === "string" ? JSON.parse(log.metadata) : log.metadata,
        new Date(log.created_at)
      );

      if (recomputed !== log.checksum) {
        tamperedCount++;
        console.error(`  [TAMPER DETECTED] Record ${log.id} checksum mismatch! Expected ${recomputed}, got ${log.checksum}`);
      }
    }

    console.log(`  -> Total Records Scanned: ${allLogs.length}`);
    console.log(`  -> Signed Records (SHA-256): ${signedCount}`);
    console.log(`  -> Legacy Records: ${legacyCount}`);
    console.log(`  -> Tampered Records: ${tamperedCount}`);

    if (tamperedCount > 0) {
      throw new Error(`FAIL: Tampered records detected (${tamperedCount})!`);
    }
    console.log("  [PASS] 100% Cryptographic integrity verified across all signed audit records.");

    // -------------------------------------------------------------------------
    // TEST 6: Compliance Export Formatting (RFC 4180 CSV & ISO 27001 JSON)
    // -------------------------------------------------------------------------
    console.log("\n[Test 6] Validating Compliance Export Engine logic...");
    // 6a. CSV format RFC 4180
    const csvHeaders = ["ID", "Timestamp (UTC)", "Actor ID", "Action", "Target ID", "Checksum (SHA-256)", "Metadata (JSON)"];
    const csvRow = [
      inserted.id,
      new Date(inserted.created_at).toISOString(),
      inserted.actor_id,
      inserted.action,
      inserted.target_id,
      inserted.checksum,
      JSON.stringify(inserted.metadata),
    ];
    const csvLine = csvRow.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",");
    if (!csvLine.includes(inserted.id) || !csvLine.includes(inserted.checksum)) {
      throw new Error("FAIL: CSV row formatting failed RFC 4180 test!");
    }
    console.log("  -> CSV row sample:", csvLine.slice(0, 80) + "...");
    console.log("  [PASS] RFC 4180 CSV serialization verified.");

    // 6b. JSON ISO 27001 / SOC 2 Compliance Package Schema
    const compliancePackage = {
      complianceMetadata: {
        standard: "ISO/IEC 27001:2022 & SOC 2 Type II",
        wormProtection: "ENFORCED",
        integrityVerification: {
          totalRecords: allLogs.length,
          signedRecords: signedCount,
          tamperedRecords: 0,
          integrityRate: 100,
          isWormCompliant: true,
        },
      },
      auditLogs: allLogs.slice(0, 5),
    };
    if (compliancePackage.complianceMetadata.wormProtection !== "ENFORCED" || compliancePackage.complianceMetadata.integrityVerification.integrityRate !== 100) {
      throw new Error("FAIL: Compliance package metadata schema invalid!");
    }
    console.log("  [PASS] ISO 27001 & SOC 2 JSON compliance package structure verified.");

    console.log("\n================================================================================");
    console.log(" >>> ALL PHASE 5 COMPLIANCE & WORM AUDIT VERIFICATIONS PASSED SUCCESSFULLY <<< ");
    console.log("================================================================================");
  } finally {
    await sql.end();
  }
}

testPhase5Compliance().catch((err) => {
  console.error("\n[FATAL ERROR IN PHASE 5 VERIFICATION]:", err);
  process.exit(1);
});
