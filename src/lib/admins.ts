import { getCloudflareContext } from "@opennextjs/cloudflare";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";

export const BOOTSTRAP_ADMINS = [
  "boss@lynli.me",
  "chulingli1988@outlook.com",
  "2952974772@qq.com",
] as const;

const BOOTSTRAP_STATE_ID = "bootstrap-admins-v1";

function getBootstrapPassword() {
  try {
    const { env } = getCloudflareContext();
    const runtime = env as unknown as { BOOTSTRAP_ADMIN_PASSWORD?: string };
    return runtime.BOOTSTRAP_ADMIN_PASSWORD || process.env.BOOTSTRAP_ADMIN_PASSWORD;
  } catch {
    return process.env.BOOTSTRAP_ADMIN_PASSWORD;
  }
}

/**
 * D1 does not provide interactive transactions. Idempotent upserts make this
 * safe to retry: existing administrator passwords are never overwritten.
 */
export async function ensureBootstrapAdmins() {
  const password = getBootstrapPassword();
  if (!password || password.length < 24) {
    throw new Error("BOOTSTRAP_ADMIN_PASSWORD 未配置或强度不足（至少 24 位）");
  }

  const state = await prisma.bootstrapState.findUnique({
    where: { id: BOOTSTRAP_STATE_ID },
  });

  if (!state) {
    for (const email of BOOTSTRAP_ADMINS) {
      await prisma.admin.upsert({
        where: { email },
        create: { email, passwordHash: hashPassword(password) },
        update: {},
      });
    }

    try {
      await prisma.bootstrapState.create({ data: { id: BOOTSTRAP_STATE_ID } });
    } catch {
      const completed = await prisma.bootstrapState.findUnique({
        where: { id: BOOTSTRAP_STATE_ID },
      });
      if (!completed) throw new Error("管理员初始化未完成，请重试");
    }
  }

  // Restore a missing built-in account without changing any existing password.
  for (const email of BOOTSTRAP_ADMINS) {
    await prisma.admin.upsert({
      where: { email },
      create: { email, passwordHash: hashPassword(password) },
      update: {},
    });
  }
}

export async function verifyAdminLogin(email: string, password: string) {
  await ensureBootstrapAdmins();
  const normalized = email.toLowerCase().trim();
  const admin = await prisma.admin.findUnique({ where: { email: normalized } });
  if (!admin || !verifyPassword(password, admin.passwordHash)) return null;
  return admin;
}
