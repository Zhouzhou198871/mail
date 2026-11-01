// Simple in-memory OTP store (suitable for demo / single-instance)
// In production with multiple instances, replace with Upstash Redis

type OTPRecord = {
  code: string;
  expiresAt: number;
  attempts: number;
};

const store = new Map<string, OTPRecord>();

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function saveOTP(email: string, code: string) {
  const key = email.toLowerCase().trim();
  store.set(key, {
    code,
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts: 0,
  });
}

export function verifyOTP(email: string, code: string): { ok: boolean; message?: string } {
  const key = email.toLowerCase().trim();
  const record = store.get(key);

  if (!record) {
    return { ok: false, message: "验证码不存在或已过期，请重新获取" };
  }

  if (Date.now() > record.expiresAt) {
    store.delete(key);
    return { ok: false, message: "验证码已过期，请重新获取" };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    store.delete(key);
    return { ok: false, message: "尝试次数过多，请重新获取验证码" };
  }

  if (record.code !== code.trim()) {
    record.attempts += 1;
    return { ok: false, message: "验证码错误" };
  }

  // success
  store.delete(key);
  return { ok: true };
}

// cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, rec] of store.entries()) {
    if (now > rec.expiresAt) store.delete(key);
  }
}, 60_000);
