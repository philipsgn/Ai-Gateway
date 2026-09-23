import { db, departments, employees, grants } from "@/db";
import { eq, inArray } from "drizzle-orm";
import { getResourceDetails } from "./catalog";

export type BudgetStatus = "NORMAL" | "WARNING" | "EXCEEDED";

export interface DepartmentBudgetSummary {
  id: string;
  name: string;
  code: string;
  monthlyBudgetUsd: number;
  spentUsd: number;
  remainingUsd: number;
  percentageUsed: number;
  status: BudgetStatus;
  employeeCount: number;
  totalLaunches: number;
}

/**
 * Calculates budget consumption and status for all registered departments
 */
export async function getAllDepartmentsBudgetStats(): Promise<DepartmentBudgetSummary[]> {
  const allDepts = await db.select().from(departments).orderBy(departments.name);
  if (allDepts.length === 0) {
    return [];
  }

  const summaries: DepartmentBudgetSummary[] = [];

  for (const dept of allDepts) {
    const stats = await getDepartmentBudgetStats(dept.id, dept);
    if (stats) {
      summaries.push(stats);
    }
  }

  return summaries;
}

/**
 * Calculates budget consumption for a specific department
 */
export async function getDepartmentBudgetStats(
  departmentId: string,
  preloadedDept?: typeof departments.$inferSelect
): Promise<DepartmentBudgetSummary | null> {
  const dept =
    preloadedDept ||
    (await db.select().from(departments).where(eq(departments.id, departmentId)).limit(1))[0];

  if (!dept) {
    return null;
  }

  const monthlyBudget = parseFloat(dept.monthlyBudgetUsd || "500.00");

  // 1. Fetch employees in this department
  const deptEmployees = await db
    .select({ id: employees.id })
    .from(employees)
    .where(eq(employees.departmentId, dept.id));

  const employeeIds = deptEmployees.map((e: { id: string }) => e.id);
  const employeeCount = employeeIds.length;

  if (employeeCount === 0) {
    return {
      id: dept.id,
      name: dept.name,
      code: dept.code,
      monthlyBudgetUsd: monthlyBudget,
      spentUsd: 0,
      remainingUsd: monthlyBudget,
      percentageUsed: 0,
      status: "NORMAL",
      employeeCount: 0,
      totalLaunches: 0,
    };
  }

  // 2. Fetch all grants for these employees
  const deptGrants = await db
    .select({
      resourceName: grants.resourceName,
      accessCount: grants.accessCount,
    })
    .from(grants)
    .where(inArray(grants.employeeId, employeeIds));

  let spentUsd = 0;
  let totalLaunches = 0;

  for (const grant of deptGrants) {
    const count = Number(grant.accessCount) || 0;
    totalLaunches += count;
    const resource = getResourceDetails(grant.resourceName);
    spentUsd += count * resource.costPerLaunch;
  }

  // Round to 2 decimal places
  spentUsd = Math.round(spentUsd * 100) / 100;
  const remainingUsd = Math.max(0, Math.round((monthlyBudget - spentUsd) * 100) / 100);
  const percentageUsed = monthlyBudget > 0 ? Math.round((spentUsd / monthlyBudget) * 1000) / 10 : 0;

  let status: BudgetStatus = "NORMAL";
  if (percentageUsed >= 100) {
    status = "EXCEEDED";
  } else if (percentageUsed >= 80) {
    status = "WARNING";
  }

  return {
    id: dept.id,
    name: dept.name,
    code: dept.code,
    monthlyBudgetUsd: monthlyBudget,
    spentUsd,
    remainingUsd,
    percentageUsed,
    status,
    employeeCount,
    totalLaunches,
  };
}
