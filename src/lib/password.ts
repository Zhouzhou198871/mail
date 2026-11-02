import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const SALT_LEN = 16;
const KEY_LEN = 32;

export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_LEN).toString("hex");
  const hash = scryptSync(password, salt, KEY_LEN).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const hashed = scryptSync(password, salt, KEY_LEN);
  const hashBuf = Buffer.from(hash, "hex");
  if (hashBuf.length !== hashed.length) return false;
  return timingSafeEqual(hashed, hashBuf);
}
