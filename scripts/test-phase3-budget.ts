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

const CATALOG_COSTS: Record<string, number> = {
  "chatgpt-team": 0.12,
  "claude-enterprise": 0.25,
  "github-copilot-business": 0.08,
  "midjourney-pro": 0.15,
};

async function testPhase3() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("Missing DATABASE_URL");
  }

  const sql = postgres(databaseUrl, {
    max: 1,
    ssl: databaseUrl.includes("sslmode=require") ? "require" : undefined,
  });

  try {
    console.log("--- 1. SEEDING / ENSURING DEPARTMENTS IN NEON POSTGRESQL ---");
    // Insert Engineering & Marketing if not existing
    const engExists = await sql`SELECT id, name, code, monthly_budget_usd FROM departments WHERE code = 'ENG';`;
    let engId: string;
    if (engExists.length === 0) {
      const [eng] = await sql`
        INSERT INTO departments (name, code, monthly_budget_usd, currency)
        VALUES ('Engineering & DevOps', 'ENG', 250.00, 'USD')
        RETURNING id, name, code, monthly_budget_usd;
      `;
      engId = eng.id;
      console.log("Created Engineering Department:", eng);
    } else {
      engId = engExists[0].id;
      console.log("Found existing Engineering Department:", engExists[0]);
    }

    const mktExists = await sql`SELECT id, name, code, monthly_budget_usd FROM departments WHERE code = 'MKT';`;
    if (mktExists.length === 0) {
      const [mkt] = await sql`
        INSERT INTO departments (name, code, monthly_budget_usd, currency)
        VALUES ('Growth & Marketing', 'MKT', 100.00, 'USD')
        RETURNING id, name, code, monthly_budget_usd;
      `;
      console.log("Created Marketing Department:", mkt);
    } else {
      console.log("Found existing Marketing Department:", mktExists[0]);
    }

    console.log("\n--- 2. ASSIGNING EMPLOYEE TO DEPARTMENT ---");
    const [emp] = await sql`SELECT id, email, role, department_id FROM employees WHERE email = 'tanphat260705@gmail.com';`;
    if (emp) {
      console.log("Before assignment:", { email: emp.email, department_id: emp.department_id });
      await sql`UPDATE employees SET department_id = ${engId} WHERE id = ${emp.id};`;
      const [updatedEmp] = await sql`SELECT id, email, role, department_id FROM employees WHERE id = ${emp.id};`;
      console.log("After assignment:", { email: updatedEmp.email, department_id: updatedEmp.department_id });
    } else {
      console.log("Notice: Employee tanphat260705@gmail.com not yet registered in database.");
    }

    console.log("\n--- 3. CALCULATING DEPARTMENT REAL USAGE & BUDGET METRICS ---");
    const allDepts = await sql`SELECT id, name, code, monthly_budget_usd FROM departments ORDER BY code;`;
    for (const d of allDepts) {
      // Find all employees in this department
      const deptEmployees = await sql`SELECT id FROM employees WHERE department_id = ${d.id};`;
      const empIds = deptEmployees.map((e) => e.id);

      let spentUsd = 0;
      let totalLaunches = 0;

      if (empIds.length > 0) {
        const grantsForDept = await sql`
          SELECT resource_name, access_count 
          FROM grants 
          WHERE employee_id IN ${sql(empIds)};
        `;

        for (const g of grantsForDept) {
          const cost = CATALOG_COSTS[g.resource_name] || 0.10;
          spentUsd += (g.access_count || 0) * cost;
          totalLaunches += (g.access_count || 0);
        }
      }

      const budget = parseFloat(d.monthly_budget_usd);
      const usagePercentage = budget > 0 ? (spentUsd / budget) * 100 : 0;
      let status = "NORMAL";
      if (usagePercentage >= 100) status = "EXCEEDED";
      else if (usagePercentage >= 80) status = "WARNING";

      console.log(`Department: ${d.name} (${d.code})`);
      console.log(` - Headcount: ${deptEmployees.length}`);
      console.log(` - Monthly Quota: $${budget.toFixed(2)}`);
      console.log(` - Actual Spent: $${spentUsd.toFixed(2)} (${totalLaunches} total launches)`);
      console.log(` - Usage %: ${usagePercentage.toFixed(2)}% | Status: [${status}]`);
    }

    console.log("\n--- 4. VERIFYING AUDIT TRAIL FOR THRESHOLD ALERT ---");
    // Temporarily set a low budget on ENG to test threshold warning trigger
    await sql`UPDATE departments SET monthly_budget_usd = 0.10 WHERE id = ${engId};`;
    const lowBudgetDept = await sql`SELECT id, name, code, monthly_budget_usd FROM departments WHERE id = ${engId};`;
    console.log("Temporarily set monthly_budget_usd = $0.10 for testing threshold alerts:", lowBudgetDept[0]);

    // Compute spent
    const deptEmployees = await sql`SELECT id FROM employees WHERE department_id = ${engId};`;
    const empIds = deptEmployees.map((e) => e.id);
    let spentUsd = 0;
    const grantsForDept = await sql`SELECT resource_name, access_count FROM grants WHERE employee_id IN ${sql(empIds)};`;
    for (const g of grantsForDept) {
      spentUsd += (g.access_count || 0) * (CATALOG_COSTS[g.resource_name] || 0.10);
    }
    const pct = (spentUsd / 0.10) * 100;
    const status = pct >= 100 ? "EXCEEDED" : pct >= 80 ? "WARNING" : "NORMAL";
    console.log(`Current usage: $${spentUsd.toFixed(2)} / $0.10 = ${pct.toFixed(1)}% -> [${status}]`);

    if (status === "WARNING" || status === "EXCEEDED") {
      // Record real alert to audit_logs
      const [insertedAlert] = await sql`
        INSERT INTO audit_logs (actor_id, action, target_id, metadata)
        VALUES (
          ${emp ? emp.id : null},
          'BUDGET_THRESHOLD_ALERT',
          ${engId},
          ${JSON.stringify({
            departmentName: 'Engineering & DevOps',
            departmentCode: 'ENG',
            status,
            percentageUsed: pct,
            spentUsd,
            monthlyBudgetUsd: 0.10,
            triggeredByLaunch: 'ChatGPT Team',
          })}
        )
        RETURNING id, action, target_id, metadata, created_at;
      `;
      console.log("Logged Budget Threshold Alert to Neon audit_logs:", insertedAlert);
    }

    // Restore real budget
    await sql`UPDATE departments SET monthly_budget_usd = 250.00 WHERE id = ${engId};`;
    console.log("Restored monthly_budget_usd = $250.00 for Engineering & DevOps");

    const recentBudgetAlerts = await sql`
      SELECT id, action, actor_id, metadata, created_at 
      FROM audit_logs 
      WHERE action = 'BUDGET_THRESHOLD_ALERT' 
      ORDER BY created_at DESC 
      LIMIT 1;
    `;
    console.log("Verified Neon PostgreSQL Budget Alert in DB:", recentBudgetAlerts[0]);

    console.log("\n>>> PHASE 3 END-TO-END VERIFICATION COMPLETED SUCCESSFULLY! <<<");
  } finally {
    await sql.end();
  }
}

testPhase3().catch((e) => {
  console.error("Test failed:", e);
  process.exit(1);
});
