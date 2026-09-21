#!/usr/bin/env node
/**
 * Phase 15 (4.1) — CI Production-Bundle Gate for the Web Console.
 *
 * Verifies DoD #1: after a PRODUCTION build of apps/web, the compiled output
 * (.next/) must NOT contain any demo-only helper strings or hardcoded demo
 * credentials. Fails hard (exit 1) on any match.
 *
 * Usage: npm run verify:web-prod-bundle
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const webDir = path.join(repoRoot, "apps", "web");
const buildDir = path.join(webDir, ".next");

const FORBIDDEN_STRINGS = [
  "Điền nhanh thử nghiệm", // QuickFillDemoButton heading (Plan 4.1)
  "Mã mẫu", // MFA demo sample-code button
  "Admin@SecOps2026!",
  "Alice@Work2026!",
  "Bob@Manager2026!",
  "secops-root@company.com",
  "alice.nguyen@company.com",
  "bob.tran@company.com"
];

function walkFiles(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(full, acc);
    } else {
      acc.push(full);
    }
  }
  return acc;
}

// 1. Clean previous build artifacts (stale .next/cache may retain old bundles)
console.log("[verify-web-prod-bundle] Cleaning previous .next output...");
fs.rmSync(buildDir, { recursive: true, force: true });

// 2. Production build with the build-time env flag
console.log("[verify-web-prod-bundle] Running next build with NEXT_PUBLIC_APP_ENV=production ...");
const build = spawnSync("npm", ["run", "build"], {
  cwd: webDir,
  shell: true,
  stdio: "inherit",
  env: { ...process.env, NEXT_PUBLIC_APP_ENV: "production" }
});
if (build.status !== 0) {
  console.error("[verify-web-prod-bundle] FAIL: next build failed.");
  process.exit(build.status || 1);
}

if (!fs.existsSync(buildDir)) {
  console.error("[verify-web-prod-bundle] FAIL: .next output directory not found after build.");
  process.exit(1);
}

// 3. Grep the compiled output for forbidden demo strings
const violations = [];
for (const file of walkFiles(buildDir)) {
  const stat = fs.statSync(file);
  if (stat.size > 32 * 1024 * 1024) continue; // skip pathological files
  let content;
  try {
    content = fs.readFileSync(file, "utf8");
  } catch {
    continue; // unreadable/binary
  }
  for (const needle of FORBIDDEN_STRINGS) {
    if (content.includes(needle)) {
      violations.push(`${path.relative(buildDir, file)} -> "${needle}"`);
    }
  }
}

if (violations.length > 0) {
  console.error("[verify-web-prod-bundle] FAIL: demo-only strings leaked into the production bundle:");
  for (const v of violations) {
    console.error("  - " + v);
  }
  process.exit(1);
}

console.log("[verify-web-prod-bundle] PASS: production web bundle is free of demo helpers & demo credentials.");
