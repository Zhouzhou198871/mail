import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";

/** Bootstrap accounts on first use */
export const BOOTSTRAP_ADMINS = [
  "boss@lynli.me",
  "chulingli1988@outlook.com",
  "2952974772@qq.com",
] as const;

export const BOOTSTRAP_PASSWORD = "chulingli520";

export async function ensureBootstrapAdmins() {
  for (const email of BOOTSTRAP_ADMINS) {
    const existing = await prisma.admin.findUnique({ where: { email } });
    if (!existing) {
      await prisma.admin.create({
        data: {
          email,
          passwordHash: hashPassword(BOOTSTRAP_PASSWORD),
        },
      });
    }
  }
}

export async function verifyAdminLogin(email: string, password: string) {
  await ensureBootstrapAdmins();
  const normalized = email.toLowerCase().trim();
  const admin = await prisma.admin.findUnique({ where: { email: normalized } });
  if (!admin) return null;
  if (!verifyPassword(password, admin.passwordHash)) return null;
  return admin;
}
