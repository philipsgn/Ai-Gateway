/**
 * Phase 15 (4.3) — PRODUCTION BOOTSTRAP: First SUPER_ADMIN (break-glass account)
 *
 * Replaces the legacy demo seed (`secops-root@company.com` / `Admin@SecOps2026!`).
 *
 * Run EXACTLY ONCE during production deployment:
 *   npm run bootstrap:admin
 *   (or: tsx scripts/bootstrap-admin.mts)
 *
 * Guarantees (Plan §4.3 / DoD #3):
 * - IDEMPOTENT: refuses to run if any ACTIVE SUPER_ADMIN already exists (exit code 1).
 * - Generates a strong random password (>= 16 chars, 128-bit entropy) that is
 *   printed EXACTLY ONCE to the deploy process stdout.
 * - NEVER writes the password to any file, audit log, Slack or email.
 * - Sets mustChangePasswordOnFirstLogin = true and mfaEnabled = false, forcing
 *   the password rotation + real TOTP enrollment flow (Phase 15 / 4.2) on first login.
 *
 * Note: this platform's store is in-memory; run this script as part of the deployment
 * bootstrap step. A production deployment with a persistent store will pass the
 * same services instance to the API process.
 */

import crypto from "crypto";
import { employeeService, authService, auditService } from "../apps/api/src/index.js";

async function main(): Promise<never> {
  const email = (process.env.BOOTSTRAP_ADMIN_EMAIL || "secops-root@company.com").toLowerCase().trim();
  const displayName = (process.env.BOOTSTRAP_ADMIN_DISPLAY_NAME || "Root Security Admin").trim();

  if (!email.includes("@")) {
    console.error("[bootstrap-admin] BOOTSTRAP_ADMIN_EMAIL must be a valid email address.");
    process.exit(1);
  }

  // IDEMPOTENCY GUARD: run-once only
  const existingAdmins = employeeService
    .list()
    .filter((e) => e.status === "ACTIVE" && employeeService.getRoles(e.id).includes("SUPER_ADMIN"));
  if (existingAdmins.length > 0) {
    console.error(
      `[bootstrap-admin] REFUSED: ${existingAdmins.length} SUPER_ADMIN already exists (${existingAdmins
        .map((e) => e.email)
        .join(", ")}). This script is run-once per deployment.`
    );
    process.exit(1);
  }

  // Strong random password: 24 random bytes -> 32 base64url chars (>= 16 chars required).
  const password = crypto.randomBytes(24).toString("base64url");

  const admin = employeeService.create({
    email,
    displayName,
    departmentId: "", // unassigned until organization configures its first department
    roles: ["SUPER_ADMIN"]
  });

  await authService.setPassword(admin.id, password, { mustChangePasswordOnFirstLogin: true });
  // mfaEnabled stays false (default) -> real TOTP enrollment (Phase 15 / 4.2) is mandatory.

  // Audit record intentionally contains NO password material (scrubbed by scrubSensitiveMetadata).
  auditService.log({
    actorId: "system_bootstrap",
    action: "BOOTSTRAP_ADMIN_CREATED",
    resourceType: "EMPLOYEE",
    resourceId: admin.id,
    result: "SUCCESS",
    metadata: {
      email: admin.email,
      mfaEnabled: false,
      mustChangePasswordOnFirstLogin: true
    },
    requestId: `req_bootstrap_${crypto.randomUUID().slice(0, 8)}`
  });

  console.log("==================================================================");
  console.log("  PHASE 15 BOOTSTRAP — First SUPER_ADMIN (break-glass) created");
  console.log("  SAVE THESE CREDENTIALS NOW — shown EXACTLY ONCE, never logged.");
  console.log("------------------------------------------------------------------");
  console.log(`  Email:                              ${email}`);
  console.log(`  Employee ID:                        ${admin.id}`);
  console.log(`  One-time password:                  ${password}`);
  console.log("------------------------------------------------------------------");
  console.log("  mustChangePasswordOnFirstLogin      = true");
  console.log("  mfaEnabled                          = false (TOTP enrollment required)");
  console.log("==================================================================");

  process.exit(0);
}

main().catch((err: unknown) => {
  console.error("[bootstrap-admin] FAILED:", err instanceof Error ? err.message : err);
  process.exit(1);
});
