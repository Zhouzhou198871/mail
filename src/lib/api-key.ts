import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

export function generateApiKeyPlaintext(): string {
  const random = randomBytes(24).toString("hex"); // 48 hex chars, use 32 chars worth
  const body = random.slice(0, 32);
  return `sk_live_${body}`;
}

export function hashApiKey(plaintext: string): string {
  return createHash("sha256").update(plaintext).digest("hex");
}

export function maskApiKey(prefix: string, lastFour: string): string {
  return `${prefix}...${lastFour}`;
}

export async function verifyApiKeyFromRequest(request: Request): Promise<{
  ok: boolean;
  userId?: string;
  apiKeyId?: string;
  error?: string;
}> {
  const authHeader = request.headers.get("authorization") || "";
  const xApiKey = request.headers.get("x-api-key") || "";

  let token = "";
  if (authHeader.toLowerCase().startsWith("bearer ")) {
    token = authHeader.slice(7).trim();
  } else if (xApiKey) {
    token = xApiKey.trim();
  }

  if (!token || !token.startsWith("sk_live_")) {
    return { ok: false, error: "缺少或无效的 API Key" };
  }

  const keyHash = hashApiKey(token);
  const record = await prisma.apiKey.findUnique({
    where: { keyHash },
  });

  if (!record || record.status !== "active") {
    return { ok: false, error: "API Key 无效或已吊销" };
  }

  // update lastUsedAt without blocking response heavily
  prisma.apiKey
    .update({
      where: { id: record.id },
      data: { lastUsedAt: new Date() },
    })
    .catch(() => {});

  return { ok: true, userId: record.userId, apiKeyId: record.id };
}
