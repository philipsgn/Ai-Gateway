import { getRedisClient } from "./redis";

export interface SessionLease {
  credentialId: string;
  employeeId: string;
  acquiredAt: number;
  expiresAt: number;
}

export interface AcquireLeaseResult {
  acquired: boolean;
  reason?: "CONCURRENCY_LIMIT_EXCEEDED" | "REDIS_UNAVAILABLE" | "INTERNAL_ERROR";
  lease?: SessionLease;
  activeCount: number;
  maxConcurrency: number;
  isExisting?: boolean;
}

export interface LeaseStatus {
  activeCount: number;
  maxConcurrency: number;
  activeEmployeeIds: string[];
}

const DEFAULT_TTL_SECONDS = 1800; // 30 minutes

/**
 * Acquires a dynamic concurrency lease for an employee on a shared credential
 */
export async function acquireSessionLease(
  credentialId: string,
  employeeId: string,
  maxConcurrency: number,
  ttlSeconds = DEFAULT_TTL_SECONDS
): Promise<AcquireLeaseResult> {
  const redis = getRedisClient();
  if (!redis) {
    console.warn("[Session Broker] Redis not configured, operating in passthrough mode.");
    return {
      acquired: true,
      activeCount: 1,
      maxConcurrency,
    };
  }

  const leaseKey = `lease:${credentialId}:${employeeId}`;
  const setKey = `lease_set:${credentialId}`;

  try {
    // 1. Check if employee already holds an active lease
    const existingLease = await redis.get<SessionLease>(leaseKey);
    if (existingLease) {
      // Renew TTL
      await redis.expire(leaseKey, ttlSeconds);
      const remainingTtl = await redis.ttl(leaseKey);
      const expiresAt = Date.now() + (remainingTtl > 0 ? remainingTtl : ttlSeconds) * 1000;
      const count = await getActiveLeaseCount(credentialId);
      return {
        acquired: true,
        isExisting: true,
        lease: {
          credentialId,
          employeeId,
          acquiredAt: existingLease.acquiredAt,
          expiresAt,
        },
        activeCount: count,
        maxConcurrency,
      };
    }

    // 2. Fetch existing set members and purge expired leases
    const members = await redis.smembers(setKey);
    const validMembers: string[] = [];

    for (const memberId of members) {
      const active = await redis.exists(`lease:${credentialId}:${memberId}`);
      if (active === 1) {
        validMembers.push(memberId);
      } else {
        // Purge expired lease member from set
        await redis.srem(setKey, memberId);
      }
    }

    // 3. Enforce Concurrency Mutex Limit
    if (validMembers.length >= maxConcurrency) {
      return {
        acquired: false,
        reason: "CONCURRENCY_LIMIT_EXCEEDED",
        activeCount: validMembers.length,
        maxConcurrency,
      };
    }

    // 4. Grant new session lease
    const now = Date.now();
    const expiresAt = now + ttlSeconds * 1000;
    const lease: SessionLease = {
      credentialId,
      employeeId,
      acquiredAt: now,
      expiresAt,
    };

    await redis.set(leaseKey, JSON.stringify(lease), { ex: ttlSeconds });
    await redis.sadd(setKey, employeeId);

    return {
      acquired: true,
      lease,
      activeCount: validMembers.length + 1,
      maxConcurrency,
    };
  } catch (error) {
    console.error("[Session Broker Error]:", error);
    return {
      acquired: false,
      reason: "INTERNAL_ERROR",
      activeCount: 0,
      maxConcurrency,
    };
  }
}

/**
 * Releases a held session lease immediately to free up the seat for teammates
 */
export async function releaseSessionLease(
  credentialId: string,
  employeeId: string
): Promise<{ released: boolean; activeCount: number }> {
  const redis = getRedisClient();
  if (!redis) {
    return { released: true, activeCount: 0 };
  }

  const leaseKey = `lease:${credentialId}:${employeeId}`;
  const setKey = `lease_set:${credentialId}`;

  try {
    await redis.del(leaseKey);
    await redis.srem(setKey, employeeId);
    const activeCount = await getActiveLeaseCount(credentialId);
    return { released: true, activeCount };
  } catch (error) {
    console.error("[Session Broker Release Error]:", error);
    return { released: false, activeCount: 0 };
  }
}

/**
 * Retrieves the count of currently active leases for a credential
 */
export async function getActiveLeaseCount(credentialId: string): Promise<number> {
  const redis = getRedisClient();
  if (!redis) return 0;

  const setKey = `lease_set:${credentialId}`;
  try {
    const members = await redis.smembers(setKey);
    let active = 0;
    for (const memberId of members) {
      const exists = await redis.exists(`lease:${credentialId}:${memberId}`);
      if (exists === 1) {
        active++;
      } else {
        await redis.srem(setKey, memberId);
      }
    }
    return active;
  } catch {
    return 0;
  }
}

/**
 * Checks if a specific employee currently has an active lease for a credential
 */
export async function getUserLease(
  credentialId: string,
  employeeId: string
): Promise<{ hasActiveLease: boolean; remainingMinutes: number; lease: SessionLease | null }> {
  const redis = getRedisClient();
  if (!redis) {
    return { hasActiveLease: false, remainingMinutes: 0, lease: null };
  }

  const leaseKey = `lease:${credentialId}:${employeeId}`;
  try {
    const data = await redis.get<SessionLease>(leaseKey);
    if (!data) {
      return { hasActiveLease: false, remainingMinutes: 0, lease: null };
    }
    const ttl = await redis.ttl(leaseKey);
    const remainingMinutes = Math.max(1, Math.round(ttl / 60));
    return {
      hasActiveLease: true,
      remainingMinutes,
      lease: data,
    };
  } catch {
    return { hasActiveLease: false, remainingMinutes: 0, lease: null };
  }
}
