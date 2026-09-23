import postgres from "postgres";
import * as fs from "fs";
import * as path from "path";

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

async function verify() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("Missing DATABASE_URL");
    process.exit(1);
  }

  const sql = postgres(databaseUrl, {
    max: 1,
    ssl: databaseUrl.includes("sslmode=require") ? "require" : undefined,
  });

  try {
    const employeesCount = await sql`SELECT count(*) FROM employees;`;
    const grantsCount = await sql`SELECT count(*) FROM grants;`;
    const auditLogsCount = await sql`SELECT count(*) FROM audit_logs;`;

    console.log("=== NEON POSTGRESQL REAL VERIFICATION ===");
    console.log("Employees Count:", employeesCount[0].count);
    console.log("Grants Count:", grantsCount[0].count);
    console.log("Audit Logs Count:", auditLogsCount[0].count);

    if (parseInt(employeesCount[0].count, 10) > 0) {
      const emps = await sql`SELECT id, email, role, created_at FROM employees LIMIT 5;`;
      console.log("\nRegistered Employees:", emps);
    }

    if (parseInt(auditLogsCount[0].count, 10) > 0) {
      const logs = await sql`SELECT action, actor_id, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 5;`;
      console.log("\nRecent Audit Logs:", logs);
    }
  } finally {
    await sql.end();
  }
}

verify().catch((err) => {
  console.error("Verification error:", err);
  process.exit(1);
});
