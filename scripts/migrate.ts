import postgres from "postgres";
import * as fs from "fs";
import * as path from "path";

// Auto-load environment variables from .env.local or .env if present
function loadEnv() {
  const envFiles = [".env.local", ".env"];
  for (const file of envFiles) {
    const fullPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
          const [key, ...values] = trimmed.split("=");
          const val = values.join("=").trim().replace(/^["']|["']$/g, "");
          if (!process.env[key.trim()]) {
            process.env[key.trim()] = val;
          }
        }
      }
      break;
    }
  }
}

loadEnv();

async function runMigration() {
  const databaseUrl = process.env.DATABASE_URL;

  console.log("----------------------------------------------------------------");
  console.log(" Enterprise AI Access - PostgreSQL Database Migration");
  console.log(" Target: employees, grants & audit_logs schema");
  console.log("----------------------------------------------------------------");

  if (!databaseUrl) {
    console.error("❌ ERROR: DATABASE_URL environment variable is not defined.");
    console.error("Please provide DATABASE_URL in .env.local or system environment.");
    process.exit(1);
  }

  const sanitizedUrl = databaseUrl.replace(/:([^:@]+)@/, ":****@");
  console.log(`Connecting to: ${sanitizedUrl}`);

  const sql = postgres(databaseUrl, {
    max: 1,
    ssl: databaseUrl.includes("sslmode=require") ? "require" : undefined,
  });

  try {
    console.log("Applying schema definitions...");

    // 1. Ensure pgcrypto extension for gen_random_uuid if on older Postgres
    await sql.unsafe(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

    // 2. Create departments table
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS departments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL UNIQUE,
        code VARCHAR(50) NOT NULL UNIQUE,
        monthly_budget_usd NUMERIC(10, 2) NOT NULL DEFAULT 500.00,
        currency VARCHAR(10) NOT NULL DEFAULT 'USD',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log("  ✓ Table 'departments' verified / created.");

    // 3. Create employees table
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS employees (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        google_sub VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        avatar_url TEXT,
        role VARCHAR(50) NOT NULL DEFAULT 'EMPLOYEE',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      ALTER TABLE employees ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id) ON DELETE SET NULL;
    `);
    console.log("  ✓ Table 'employees' verified / created (with department_id).");

    // 4. Create audit_logs table
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        actor_id VARCHAR(255),
        action VARCHAR(100) NOT NULL,
        target_id VARCHAR(255),
        metadata JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log("  ✓ Table 'audit_logs' verified / created.");

    // 5. Create grants table
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS grants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        resource_name VARCHAR(255) NOT NULL,
        granted_by VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
        access_count INTEGER NOT NULL DEFAULT 0,
        last_accessed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMPTZ
      );

      ALTER TABLE grants ADD COLUMN IF NOT EXISTS access_count INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE grants ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMPTZ;
    `);
    console.log("  ✓ Table 'grants' verified / created (with access_count & last_accessed_at).");

    // 6. Create vault_credentials table
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS vault_credentials (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        resource_name VARCHAR(255) NOT NULL,
        account_email VARCHAR(255) NOT NULL,
        encrypted_secret TEXT NOT NULL,
        iv VARCHAR(64) NOT NULL,
        auth_tag VARCHAR(64) NOT NULL,
        max_concurrency INTEGER NOT NULL DEFAULT 1,
        status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
        last_rotated_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log("  ✓ Table 'vault_credentials' verified / created.");

    // 7. Create indexes
    await sql.unsafe(`
      CREATE INDEX IF NOT EXISTS idx_departments_code ON departments(code);
      CREATE INDEX IF NOT EXISTS idx_employees_google_sub ON employees(google_sub);
      CREATE INDEX IF NOT EXISTS idx_employees_department_id ON employees(department_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_grants_employee_id ON grants(employee_id);
      CREATE INDEX IF NOT EXISTS idx_grants_status ON grants(status);
      CREATE INDEX IF NOT EXISTS idx_vault_credentials_resource ON vault_credentials(resource_name);
      CREATE INDEX IF NOT EXISTS idx_vault_credentials_status ON vault_credentials(status);
    `);
    console.log("  ✓ Indexes verified / created.");

    console.log("----------------------------------------------------------------");
    console.log("✅ SUCCESS: Database migration applied cleanly!");
    console.log("----------------------------------------------------------------");
  } catch (error) {
    console.error("❌ Migration failed with error:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runMigration();
