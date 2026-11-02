import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";

export function getClientIp(request: Request): string {
  return request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-nf-client-connection-ip") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
}

export async function enforceRateLimit(
  scope: string,
  limit: number,
  windowMs: number
): Promise<boolean> {
  const bucketKey = createHash("sha256").update(scope).digest("hex");
  const statement = [
    'INSERT INTO "RateLimitBucket" ("key", "count", "windowStart", "updatedAt") VALUES (?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
    'ON CONFLICT ("key") DO UPDATE SET',
    '"count" = CASE WHEN (julianday(CURRENT_TIMESTAMP) - julianday("RateLimitBucket"."windowStart")) * 86400000 >= ? THEN 1 ELSE "RateLimitBucket"."count" + 1 END,',
    '"windowStart" = CASE WHEN (julianday(CURRENT_TIMESTAMP) - julianday("RateLimitBucket"."windowStart")) * 86400000 >= ? THEN CURRENT_TIMESTAMP ELSE "RateLimitBucket"."windowStart" END,',
    '"updatedAt" = CURRENT_TIMESTAMP RETURNING "count"',
  ].join(" ");

  const rows = await prisma.$queryRawUnsafe<Array<{ count: number }>>(
    statement,
    bucketKey,
    windowMs,
    windowMs
  );

  if (Math.random() < 0.01) {
    void prisma.$executeRawUnsafe(
      'DELETE FROM "RateLimitBucket" WHERE "updatedAt" < datetime("now", "-7 days")'
    ).catch(() => {});
  }
  return Number(rows[0]?.count ?? limit + 1) <= limit;
}
