import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";

export function getClientIp(request: Request): string {
  return request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-nf-client-connection-ip") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
}

/** PostgreSQL-backed fixed-window limiter shared by Netlify function instances. */
export async function enforceRateLimit(
  scope: string,
  limit: number,
  windowMs: number
): Promise<boolean> {
  const bucketKey = createHash("sha256").update(scope).digest("hex");
  const statement = [
    'INSERT INTO "RateLimitBucket" ("key", "count", "windowStart", "updatedAt") VALUES ($1, 1, NOW(), NOW())',
    'ON CONFLICT ("key") DO UPDATE SET',
    '"count" = CASE WHEN "RateLimitBucket"."windowStart" <= NOW() - ($2 * INTERVAL \\'1 millisecond\\') THEN 1 ELSE "RateLimitBucket"."count" + 1 END,',
    '"windowStart" = CASE WHEN "RateLimitBucket"."windowStart" <= NOW() - ($2 * INTERVAL \\'1 millisecond\\') THEN NOW() ELSE "RateLimitBucket"."windowStart" END,',
    '"updatedAt" = NOW() RETURNING "count"',
  ].join(" ");

  const rows = await prisma.$queryRawUnsafe<Array<{ count: number }>>(
    statement, bucketKey, windowMs
  );

  if (Math.random() < 0.01) {
    void prisma.$executeRawUnsafe(
      'DELETE FROM "RateLimitBucket" WHERE "updatedAt" < NOW() - INTERVAL \\'7 days\\''
    ).catch(() => {});
  }
  return (rows[0]?.count ?? limit + 1) <= limit;
}
