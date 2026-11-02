import { createCipheriv, randomBytes } from "node:crypto";
import { getCloudflareContext } from "@opennextjs/cloudflare";

const PREFIX = "enc:v1:";

function getEncryptionKey() {
  try {
    const { env } = getCloudflareContext();
    const runtime = env as unknown as { PROVIDER_ENCRYPTION_KEY?: string };
    return runtime.PROVIDER_ENCRYPTION_KEY || process.env.PROVIDER_ENCRYPTION_KEY || "";
  } catch {
    return process.env.PROVIDER_ENCRYPTION_KEY || "";
  }
}

export function encryptSecret(value: string): string {
  const keyHex = getEncryptionKey();
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
