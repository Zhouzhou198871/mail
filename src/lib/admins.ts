import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";

export const BOOTSTRAP_ADMINS = [
  "boss@lynli.me",
  "chulingli1988@outlook.com",
  "2952974772@qq.com",
] as const;

const BOOTSTRAP_STATE_ID = "bootstrap-admins-v1";

function isUniqueConstraintError(error: unknown) {
  return typeof error === "object" && error !== null &&
    "code" in error && (error as { code?: string }).code === "P2002";
}

/** Provision the three built-in administrators exactly once from a Netlify secret. */
export async function ensureBootstrapAdmins() {
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  if (!password || password.length < 24) {
    throw new Error("BOOTSTRAP_ADMIN_PASSWORD 未配置或强度不足（至少 24 位）");
  }

  const state = await prisma.bootstrapState.findUnique({
    where: { id: BOOTSTRAP_STATE_ID },
  });

  if (!state) {
    try {
      await prisma.$transaction(async (tx) => {
        const transactionState = await tx.bootstrapState.findUnique({
          where: { id: BOOTSTRAP_STATE_ID },
        });
        if (transactionState) return;

        for (const email of BOOTSTRAP_ADMINS) {
          await tx.admin.upsert({
            where: { email },
            create: { email, passwordHash: hashPassword(password) },
            update: { passwordHash: hashPassword(password) },
          });
        }
        await tx.bootstrapState.create({ data: { id: BOOTSTRAP_STATE_ID } });
      });
    } catch (error) {
      if (!isUniqueConstraintError(error)) throw error;
      const completed = await prisma.bootstrapState.findUnique({
        where: { id: BOOTSTRAP_STATE_ID },
      });
      if (!completed) throw error;
    }
  }

  // Restore a missing built-in account without overwriting an existing password.
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
