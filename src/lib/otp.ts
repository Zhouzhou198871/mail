import { prisma } from "@/lib/prisma";

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS_WINDOW_MS = 10 * 60 * 1000;

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function saveOTP(email: string, code: string) {
  const normalized = email.toLowerCase().trim();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  // 清理该邮箱旧验证码
  await prisma.verificationCode.deleteMany({
    where: { email: normalized },
  });

  await prisma.verificationCode.create({
    data: {
      email: normalized,
      code,
      expiresAt,
    },
  });
}

export async function verifyOTP(
  email: string,
  code: string
): Promise<{ ok: boolean; message?: string }> {
  const normalized = email.toLowerCase().trim();
  const trimmedCode = code.trim();

  const record = await prisma.verificationCode.findFirst({
    where: { email: normalized },
    orderBy: { createdAt: "desc" },
  });

  if (!record) {
    return { ok: false, message: "验证码不存在或已过期，请重新获取" };
  }

  if (new Date() > record.expiresAt) {
    await prisma.verificationCode.deleteMany({ where: { email: normalized } });
    return { ok: false, message: "验证码已过期，请重新获取" };
  }

  if (record.code !== trimmedCode) {
    return { ok: false, message: "验证码错误" };
  }

  // 校验成功后删除该邮箱所有验证码
  await prisma.verificationCode.deleteMany({ where: { email: normalized } });
  return { ok: true };
}

export async function cleanupExpiredCodes() {
  await prisma.verificationCode.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
}
