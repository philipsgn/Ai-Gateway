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
export declare function runSeed(options?: {
    silent?: boolean;
}): Promise<{
    connected: boolean;
    departmentsCount: number;
    employeesCount: number;
    adminEmail?: undefined;
    adminPassword?: undefined;
} | {
    connected: boolean;
    departmentsCount: number;
    employeesCount: number;
    adminEmail: string;
    adminPassword: string;
}>;
