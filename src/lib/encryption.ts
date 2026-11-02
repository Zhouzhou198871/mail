import { createCipheriv, randomBytes } from "node:crypto";

const PREFIX = "enc:v1:";

export function encryptSecret(value: string): string {
  const keyHex = process.env.PROVIDER_ENCRYPTION_KEY || "";
  if (!/^[a-f0-9]{64}$/i.test(keyHex)) {
    throw new Error("PROVIDER_ENCRYPTION_KEY 未正确配置");
  }
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", Buffer.from(keyHex, "hex"), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [
    PREFIX.slice(0, -1),
    iv.toString("hex"),
    cipher.getAuthTag().toString("hex"),
    ciphertext.toString("hex"),
  ].join(":");
}

export function isEncryptedSecret(value: string): boolean {
  return value.startsWith(PREFIX);
}
