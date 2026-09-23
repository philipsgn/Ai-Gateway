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

async function run() {
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
    console.log("=== VERIFYING PHASE 2 LAUNCH LOGIC ON NEON POSTGRESQL ===");

    // 1. Get employee
    const employees = await sql`SELECT id, email, role FROM employees LIMIT 1;`;
    if (employees.length === 0) {
      console.error("No employee found in DB!");
      process.exit(1);
    }
    const emp = employees[0];
    console.log("Target Employee:", emp.email, `(${emp.id})`);

    // 2. Issue a real Grant for ChatGPT Team
    const [grant] = await sql`
      INSERT INTO grants (
        employee_id,
        resource_name,
        granted_by,
        status,
        access_count,
        expires_at
      ) VALUES (
        ${emp.id},
        'ChatGPT Team',
        'tanphat260705@gmail.com',
        'ACTIVE',
        0,
        NOW() + INTERVAL '30 days'
      ) RETURNING id, resource_name, status, access_count, last_accessed_at, expires_at;
    `;
    console.log("\n[OK] Issued Grant:", grant);

    // 3. Issue audit log for GRANT_ISSUED
    await sql`
      INSERT INTO audit_logs (
        actor_id,
        action,
        target_id,
        metadata
      ) VALUES (
        ${emp.id},
        'GRANT_ISSUED',
        ${emp.id},
        ${JSON.stringify({ grantId: grant.id, resourceName: grant.resource_name })}
      );
    `;
    console.log("[OK] Recorded Audit Log: GRANT_ISSUED");

    // 4. Simulate Launch Gate: increment access_count and set last_accessed_at
    const [updatedGrant] = await sql`
      UPDATE grants
      SET access_count = access_count + 1,
          last_accessed_at = NOW()
      WHERE id = ${grant.id}
      RETURNING id, resource_name, access_count, last_accessed_at;
    `;
    console.log("\n[OK] Simulated Launch - Grant Metrics Updated:", updatedGrant);

    // 5. Log AI_SERVICE_LAUNCHED in audit_logs
    await sql`
      INSERT INTO audit_logs (
        actor_id,
        action,
        target_id,
        metadata
      ) VALUES (
        ${emp.id},
        'AI_SERVICE_LAUNCHED',
        ${grant.id},
        ${JSON.stringify({
          resourceName: grant.resource_name,
          officialUrl: 'https://chatgpt.com',
          accessCount: updatedGrant.access_count,
        })}
      );
    `;
    console.log("[OK] Recorded Audit Log: AI_SERVICE_LAUNCHED");

    // 6. Also issue a second grant (Cursor Pro / Business) so employee has multiple tools in Hub
    const [grant2] = await sql`
      INSERT INTO grants (
        employee_id,
        resource_name,
        granted_by,
        status,
        access_count,
        expires_at
      ) VALUES (
        ${emp.id},
        'Cursor Pro / Business',
        'tanphat260705@gmail.com',
        'ACTIVE',
        0,
        NOW() + INTERVAL '90 days'
      ) RETURNING id, resource_name, status, access_count;
    `;
    console.log("\n[OK] Issued Second Grant for Dashboard Hub:", grant2);

    // 7. Verify all grants & audit logs in DB
    const finalGrants = await sql`
      SELECT id, resource_name, status, access_count, last_accessed_at
      FROM grants
      ORDER BY created_at DESC;
    `;
    console.log("\n=== FINAL GRANTS IN NEON POSTGRESQL ===");
    console.table(finalGrants);

    const finalLogs = await sql`
      SELECT id, action, actor_id, target_id, created_at
      FROM audit_logs
      ORDER BY created_at DESC
      LIMIT 5;
    `;
    console.log("\n=== RECENT AUDIT LOGS IN NEON POSTGRESQL ===");
    console.table(finalLogs);

  } finally {
    await sql.end();
  }
}

run().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
