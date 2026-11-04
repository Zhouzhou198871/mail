import "dotenv/config";
import crypto from "node:crypto";
import Database from "better-sqlite3";
import express from "express";
import nodemailer from "nodemailer";

const {
  VPS_MAIL_API_KEY,
  SMTP_HOST = "127.0.0.1",
  SMTP_PORT = "25",
  SMTP_FROM = "MailHub <no-reply@lynli.me>",
  IDEMPOTENCY_DB = "./mail-idempotency.sqlite",
  PORT = "8787",
  HOST = "127.0.0.1",
} = process.env;

if (!VPS_MAIL_API_KEY || VPS_MAIL_API_KEY.length < 24) {
  throw new Error("VPS_MAIL_API_KEY must be configured and at least 24 characters long");
}

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "10mb", strict: true }));

const db = new Database(IDEMPOTENCY_DB);
db.pragma("journal_mode = WAL");
db.exec(`
  CREATE TABLE IF NOT EXISTS mail_idempotency (
    idempotency_key TEXT PRIMARY KEY,
    status TEXT NOT NULL,
    message_id TEXT,
    updated_at INTEGER NOT NULL
  );
`);
const getRecord = db.prepare("SELECT status, message_id, updated_at FROM mail_idempotency WHERE idempotency_key = ?");
const insertRecord = db.prepare("INSERT INTO mail_idempotency (idempotency_key, status, updated_at) VALUES (?, 'processing', ?)");
const resetRecord = db.prepare("UPDATE mail_idempotency SET status = 'processing', message_id = NULL, updated_at = ? WHERE idempotency_key = ?");
const markSent = db.prepare("UPDATE mail_idempotency SET status = 'sent', message_id = ?, updated_at = ? WHERE idempotency_key = ?");
const markFailed = db.prepare("UPDATE mail_idempotency SET status = 'failed', updated_at = ? WHERE idempotency_key = ?");

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT),
  secure: false,
  pool: true,
  maxConnections: 3,
  maxMessages: 100,
  connectionTimeout: 10_000,
  greetingTimeout: 10_000,
  socketTimeout: 30_000,
});

function authorized(req) {
  const header = req.get("authorization") || "";
  const supplied = header.startsWith("Bearer ") ? header.slice(7) : "";
  const a = Buffer.from(supplied);
  const b = Buffer.from(VPS_MAIL_API_KEY);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function validEmail(value) {
  return typeof value === "string" && value.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
function decodeAttachments(items) {
  if (items === undefined) return [];
  if (!Array.isArray(items) || items.length > 10) throw new Error("attachments must be an array with at most 10 items");
  return items.map((item) => {
    if (!item || typeof item.filename !== "string" || item.filename.length > 255 ||
        typeof item.contentBase64 !== "string" || item.contentBase64.length > 8 * 1024 * 1024) {
      throw new Error("invalid attachment");
    }
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(item.contentBase64)) throw new Error("attachment content must be Base64");
    return {
      filename: item.filename,
      content: Buffer.from(item.contentBase64, "base64"),
      contentType: typeof item.contentType === "string" ? item.contentType : undefined,
      contentDisposition: item.disposition === "inline" ? "inline" : "attachment",
      cid: typeof item.cid === "string" ? item.cid : undefined,
    };
  });
}

app.get("/health", (_req, res) => res.json({ ok: true }));

app.post("/send", async (req, res) => {
  if (!authorized(req)) return res.status(401).json({ success: false, error: "Unauthorized" });

  const { to, from, subject, html, attachments } = req.body || {};
  if (!validEmail(to) || typeof subject !== "string" || !subject.trim() ||
      subject.length > 200 || typeof html !== "string" || !html.trim() ||
      html.length > 500_000) {
    return res.status(400).json({ success: false, error: "Invalid to, subject, or html" });
  }
  const idempotencyKey = req.get("x-idempotency-key");
  if (!idempotencyKey || idempotencyKey.length > 200) {
    return res.status(400).json({ success: false, error: "X-Idempotency-Key is required" });
  }
  const sender = typeof from === "string" && from.trim() ? from.trim() : SMTP_FROM;

  let files;
  try {
    files = decodeAttachments(attachments);
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }

  const now = Date.now();
  const existing = getRecord.get(idempotencyKey);
  if (existing?.status === "sent") {
    return res.status(200).json({
      success: true, duplicate: true, messageId: existing.message_id,
    });
  }
  if (existing?.status === "processing" && now - existing.updated_at < 5 * 60 * 1000) {
    return res.status(409).json({ success: false, retryable: true, error: "This message is already processing" });
  }
  if (existing) resetRecord.run(now, idempotencyKey);
  else insertRecord.run(idempotencyKey, now);

  try {
    const info = await transporter.sendMail({
      from: sender,
      to: to.trim(),
      subject: subject.trim(),
      html,
      attachments: files,
    });
    markSent.run(info.messageId || idempotencyKey, Date.now(), idempotencyKey);
    return res.status(200).json({
      success: true,
      duplicate: false,
      messageId: info.messageId || idempotencyKey,
    });
  } catch (error) {
    markFailed.run(Date.now(), idempotencyKey);
    console.error("[vps-mail] SMTP delivery failed", error);
    return res.status(502).json({ success: false, error: "SMTP delivery failed" });
  }
});

app.use((error, _req, res, _next) => {
  if (error instanceof SyntaxError) return res.status(400).json({ success: false, error: "Invalid JSON" });
  if (error?.type === "entity.too.large") return res.status(413).json({ success: false, error: "Request too large" });
  console.error("[vps-mail] request error", error);
  return res.status(500).json({ success: false, error: "Internal server error" });
});

const server = app.listen(Number(PORT), HOST, () => {
  console.log(`VPS mail API listening on http://${HOST}:${PORT}`);
});
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    server.close(() => {
      transporter.close();
      db.close();
      process.exit(0);
    });
  });
}