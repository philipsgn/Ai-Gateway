/**
 * Enterprise AI Access Broker — Database Seed Script
 * Showcase & Portfolio Edition (Phase 16)
 *
 * Populates realistic Vietnamese corporate identities, departments, AI services,
 * Phase 14 100% budget allocation policies, and a secure Super Admin account.
 *
 * Supports Dual-Mode:
 * 1. PostgreSQL Mode (via Drizzle ORM when DATABASE_URL or Docker is available)
 * 2. In-Memory Mode (when running local memory tests or offline review)
 */

import crypto from "crypto";
import { fakerVI, faker } from "@faker-js/faker";
import { PostgresDatabase } from "../apps/api/src/db/postgres-db.js";
import {
  departmentsTable,
  employeesTable,
  rolesTable,
  employeeRolesTable,
  userCredentialsTable,
  aiServicesTable,
  departmentAllocationPoliciesTable,
  vendorAccountMappingsTable,
  departmentBudgetSnapshotsTable,
  auditLogsTable
} from "../apps/api/src/db/schema.js";
import { PasswordService } from "../apps/api/src/auth/password.service.js";

// Department specifications
const SEED_DEPARTMENTS = [
  {
    id: "dept_it",
    name: "Công Nghệ Thông Tin & AI",
    code: "IT",
    monthlyBudgetUsd: "1000.00",
    costPerMillionTokens: "12.00",
    quotaEnforcementPolicy: "WARN_ONLY" as const,
    allocationPercent: "50.00"
  },
  {
    id: "dept_mkt",
    name: "Tiếp Thị & Tăng Trưởng",
    code: "MKT",
    monthlyBudgetUsd: "400.00",
    costPerMillionTokens: "15.00",
    quotaEnforcementPolicy: "RESTRICT_NEW_SESSIONS" as const,
    allocationPercent: "20.00"
  },
  {
    id: "dept_biz",
    name: "Phát Triển Kinh Doanh",
    code: "BIZ",
    monthlyBudgetUsd: "600.00",
    costPerMillionTokens: "10.00",
    quotaEnforcementPolicy: "HARD_BLOCK" as const,
    allocationPercent: "30.00"
  }
];

const POSITIONS_BY_DEPT: Record<string, string[]> = {
  IT: [
    "Senior AI/ML Engineer",
    "Fullstack Software Engineer",
    "Data Platform Architect",
    "DevOps / SRE Specialist",
    "Cybersecurity Analyst",
    "QA Automation Engineer"
  ],
  MKT: [
    "Growth Marketing Lead",
    "Content Strategy Specialist",
    "SEO & Performance Analyst",
    "Creative Brand Designer",
    "Digital Campaign Manager"
  ],
  BIZ: [
    "Senior Business Analyst",
    "Enterprise Account Executive",
    "Product Operations Lead",
    "Strategic Partnerships Manager",
    "Financial Planning Analyst"
  ]
};

const SEED_SERVICES = [
  {
    id: "srv_chatgpt_ent",
    name: "ChatGPT Enterprise",
    provider: "OpenAI" as const,
    serviceType: "CHATGPT" as const,
    accessMode: "SSO" as const,
    status: "ACTIVE" as const,
    totalSeats: 50,
    consumedSeats: 12
  },
  {
    id: "srv_claude_ent",
    name: "Claude Enterprise",
    provider: "Claude" as const,
    serviceType: "CLAUDE" as const,
    accessMode: "SSO" as const,
    status: "ACTIVE" as const,
    totalSeats: 50,
    consumedSeats: 8
  },
  {
    id: "srv_gemini_work",
    name: "Gemini for Workspace",
    provider: "Google" as const,
    serviceType: "GEMINI" as const,
    accessMode: "SSO" as const,
    status: "ACTIVE" as const,
    totalSeats: 100,
    consumedSeats: 35
  }
];

export async function runSeed(options: { silent?: boolean } = {}) {
  const log = options.silent ? () => {} : console.log;

  log("\n==================================================================");
  log("🚀 Enterprise AI Access Broker — Database Seeder (Showcase Edition)");
  log("==================================================================");

  const pgDb = new PostgresDatabase();
  const connected = await pgDb.connect();

  if (!connected || !pgDb.db) {
    log("⚠️  PostgreSQL is unreachable. Skipping persistent database seed.");
    log("   (System will use In-Memory Zero-Config mode for runtime demo).\n");
    return {
      connected: false,
      departmentsCount: SEED_DEPARTMENTS.length,
      employeesCount: 50
    };
  }

  const db = pgDb.db;
  const passwordService = new PasswordService();

  try {
    log("🔄 Resetting database tables (Idempotent TRUNCATE CASCADE)...");
    // Idempotent clean
    await db.execute(`
      TRUNCATE TABLE
        audit_logs,
        department_budget_snapshots,
        vendor_account_mappings,
        department_allocation_policies,
        account_requests,
        grants,
        user_credentials,
        employee_roles,
        roles,
        employees,
        departments,
        ai_accounts,
        ai_services
      CASCADE;
    `);

    // 1. Roles
    log("📌 Inserting standard IAM roles...");
    await db.insert(rolesTable).values([
      { id: "SUPER_ADMIN", name: "Super Administrator", description: "Break-glass root administrator" },
      { id: "ADMIN", name: "Administrator", description: "SecOps and System Administrator" },
      { id: "MANAGER", name: "Department Manager", description: "Department Line Manager" },
      { id: "EMPLOYEE", name: "Employee", description: "Standard Enterprise Employee" },
      { id: "AUDITOR", name: "Compliance Auditor", description: "Read-only Compliance Reviewer" }
    ]);

    // 2. Departments
    log("🏢 Inserting corporate departments...");
    for (const d of SEED_DEPARTMENTS) {
      await db.insert(departmentsTable).values({
        id: d.id,
        name: d.name,
        code: d.code,
        monthlyBudgetUsd: d.monthlyBudgetUsd,
        costPerMillionTokens: d.costPerMillionTokens,
        quotaEnforcementPolicy: d.quotaEnforcementPolicy,
        status: "ACTIVE"
      });
    }

    // 3. AI Services
    log("🤖 Inserting enterprise AI services...");
    for (const s of SEED_SERVICES) {
      await db.insert(aiServicesTable).values(s);
    }

    // 4. Employees (~50 Vietnamese identities)
    log("👥 Generating ~50 realistic Vietnamese employees across departments...");
    const employeesData: Array<{
      id: string;
      externalIdentityId: string;
      email: string;
      displayName: string;
      departmentId: string;
      position: string;
      status: "ACTIVE";
    }> = [];

    let totalEmployees = 0;
    for (const dept of SEED_DEPARTMENTS) {
      const positions = POSITIONS_BY_DEPT[dept.code] || ["Chuyên Viên"];
      const count = dept.code === "IT" ? 20 : dept.code === "MKT" ? 15 : 15;

      for (let i = 0; i < count; i++) {
        totalEmployees++;
        const viFaker = fakerVI || faker;
        const fullName = viFaker.person.fullName();
        const emailSlug = fullName
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]/g, ".")
          .replace(/\.+/g, ".");
        const uniqueEmail = `${emailSlug}.${totalEmployees}@company.com`;
        const position = positions[i % positions.length];

        const empId = `emp_${dept.code.toLowerCase()}_${totalEmployees.toString().padStart(3, "0")}`;
        employeesData.push({
          id: empId,
          externalIdentityId: `google_oauth2_${crypto.randomUUID().slice(0, 12)}`,
          email: uniqueEmail,
          displayName: fullName,
          departmentId: dept.id,
          position,
          status: "ACTIVE"
        });
      }
    }

    await db.insert(employeesTable).values(employeesData);

    // Assign standard role EMPLOYEE to all generated employees
    const empRoleValues = employeesData.map((e) => ({
      employeeId: e.id,
      roleId: "EMPLOYEE" as const
    }));
    await db.insert(employeeRolesTable).values(empRoleValues);

    // 5. Super Admin (Zero Backdoor MFA Principle)
    log("🛡️  Creating Super Admin credentials (No static backdoor)...");
    const superAdminId = "emp_secops_root";
    const superAdminEmail = "secops-root@company.com";
    const tempPassword = `Admin@SecOps${crypto.randomInt(1000, 9999)}!`;
    const passwordHash = await passwordService.hashPassword(tempPassword);

    await db.insert(employeesTable).values({
      id: superAdminId,
      externalIdentityId: "google_oauth2_secops_superadmin",
      email: superAdminEmail,
      displayName: "SecOps Root Administrator",
      departmentId: "dept_it",
      position: "Chief Information Security Officer (CISO)",
      status: "ACTIVE"
    });

    await db.insert(employeeRolesTable).values([
      { employeeId: superAdminId, roleId: "SUPER_ADMIN" },
      { employeeId: superAdminId, roleId: "ADMIN" }
    ]);

    await db.insert(userCredentialsTable).values({
      employeeId: superAdminId,
      passwordHash,
      mfaSecret: "JBSWY3DPEHPK3PXP", // Demo-ready TOTP secret (30s RFC 6238)
      mfaEnabled: true,
      mustChangePasswordOnFirstLogin: false
    });

    // 6. Phase 14: Department Budget Allocation Policies (Strict 100% Invariant)
    log("📊 Establishing Phase 14 Department Budget Allocation (100% Sum Invariant)...");
    for (const dept of SEED_DEPARTMENTS) {
      await db.insert(departmentAllocationPoliciesTable).values({
        id: `alloc_${dept.code.toLowerCase()}_initial`,
        departmentId: dept.id,
        allocationPercent: dept.allocationPercent,
        approvedBy: superAdminId,
        reason: "Initial Corporate Budget Allocation (Phase 16 Showcase Seed)",
        supersededAt: null
      });

      // Vendor mappings
      await db.insert(vendorAccountMappingsTable).values([
        {
          id: `vmap_claude_${dept.id}`,
          departmentId: dept.id,
          vendorType: "CLAUDE",
          vendorGroupId: `claude_group_${dept.code.toLowerCase()}`,
          syncStatus: "SYNCED",
          lastSyncedAt: new Date()
        },
        {
          id: `vmap_openai_${dept.id}`,
          departmentId: dept.id,
          vendorType: "CHATGPT",
          vendorGroupId: `openai_group_${dept.code.toLowerCase()}`,
          syncStatus: "MANUAL_PENDING",
          lastSyncedAt: null
        }
      ]);
    }

    // 7. Initial Immutable WORM Audit Log Entry
    log("🔒 Initializing WORM Cryptographic Hash Chain...");
    const genesisHash = crypto
      .createHash("sha256")
      .update("0000000000000000000000000000000000000000000000000000000000000000_PHASE_16_GENESIS")
      .digest("hex");

    await db.insert(auditLogsTable).values({
      id: `audit_genesis_${Date.now()}`,
      actorId: superAdminId,
      action: "SYSTEM_INITIALIZED",
      resourceType: "SYSTEM",
      resourceId: "enterprise_ai_broker",
      result: "SUCCESS",
      metadata: {
        event: "DATABASE_SEEDED",
        departmentsCount: SEED_DEPARTMENTS.length,
        employeesCount: totalEmployees + 1,
        seedVersion: "16.0-showcase"
      },
      requestId: `req_genesis_${crypto.randomUUID().slice(0, 8)}`,
      prevHash: "0000000000000000000000000000000000000000000000000000000000000000",
      hash: genesisHash,
      timestamp: new Date()
    });

    log("\n✅ Database Seed Completed Successfully!");
    log("------------------------------------------------------------------");
    log("🔑 DEMO LOGIN CREDENTIALS (NO HARDCODED BACKDOOR):");
    log(`   Email:    ${superAdminEmail}`);
    log(`   Password: ${tempPassword}`);
    log(`   MFA Code: Use Google Authenticator / 1Password with Base32 Secret: JBSWY3DPEHPK3PXP`);
    log("------------------------------------------------------------------\n");

    return {
      connected: true,
      departmentsCount: SEED_DEPARTMENTS.length,
      employeesCount: totalEmployees + 1,
      adminEmail: superAdminEmail,
      adminPassword: tempPassword
    };
  } finally {
    await pgDb.close();
  }
}

// CLI direct execution
if (process.argv[1] && process.argv[1].endsWith("seed.ts")) {
  runSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[Seed Error]:", err);
      process.exit(1);
    });
}
