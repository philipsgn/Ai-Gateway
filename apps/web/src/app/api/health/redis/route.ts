import { NextResponse } from "next/server";
import { checkRedisHealth } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await checkRedisHealth();
  return NextResponse.json(result);
}
