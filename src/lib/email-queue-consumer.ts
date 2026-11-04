interface D1Statement {
  bind(...values: unknown[]): D1Statement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<unknown>;
}
interface D1Database { prepare(sql: string): D1Statement; }
interface EmailAttachment {
  filename: string;
  contentBase64: string;
  contentType?: string;
  disposition?: "attachment" | "inline";
  cid?: string;
}
interface EmailQueueMessage {
  logId: string;
  to: string;
  from: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}
interface QueueMessage<T> {
  body: T; attempts: number; ack(): void;
  retry(options?: { delaySeconds?: number }): void;
}
interface QueueBatch<T> { queue: string; messages: QueueMessage<T>[]; }
interface Env {
  DB: D1Database;
  VPS_MAIL_API_URL?: string;
  VPS_MAIL_API_KEY?: string;
}
const DEAD_QUEUE = "mailhub-email-dead";
const MAX_MESSAGE_BYTES = 120 * 1024;
const VPS_TIMEOUT_MS = 15_000;
const SEND_INTERVAL_MS = 125;
const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

class DeliveryError extends Error {
  constructor(message: string, public readonly retryable: boolean) {
    super(message);
    this.name = "DeliveryError";
  }
}
function errorText(payload: unknown): string {
  if (payload && typeof payload === "object") {
    const item = payload as Record<string, unknown>;
    if (typeof item.message === "string") return item.message;
    if (typeof item.error === "string") return item.error;
  }
  return JSON.stringify(payload).slice(0, 300);
}
async function sendToVps(message: EmailQueueMessage, env: Env): Promise<void> {
  const endpoint = env.VPS_MAIL_API_URL?.trim();
  const apiKey = env.VPS_MAIL_API_KEY;
  if (!endpoint || !apiKey) {
    throw new DeliveryError("VPS_MAIL_API_URL 或 VPS_MAIL_API_KEY 未配置", false);
  }
  let url: URL;
  try {
    url = new URL(endpoint);
    if (url.protocol !== "https:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
      throw new Error("VPS 邮件接口必须使用 HTTPS");
    }
  } catch (error) {
    throw new DeliveryError("VPS_MAIL_API_URL 无效：" + (error instanceof Error ? error.message : "invalid URL"), false);
  }

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": message.logId,
      },
      body: JSON.stringify({
        to: message.to,
        from: message.from,
        subject: message.subject,
        html: message.html,
        ...(message.attachments?.length ? { attachments: message.attachments } : {}),
      }),
      signal: AbortSignal.timeout(VPS_TIMEOUT_MS),
    });
  } catch (error) {
    throw new DeliveryError(
      "VPS 邮件接口网络/超时异常：" + (error instanceof Error ? error.message : "network error"),
      true
    );
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const retryable = response.status === 408 || response.status === 409 ||
      response.status === 425 || response.status === 429 || response.status >= 500;
    throw new DeliveryError(`VPS HTTP ${response.status}: ${errorText(payload)}`, retryable);
  }
  if (payload && typeof payload === "object" && (payload as Record<string, unknown>).success === false) {
    throw new DeliveryError("VPS 返回发送失败：" + errorText(payload), false);
  }
}
async function updateLog(env: Env, logId: string, status: string, error: string | null): Promise<void> {
  await env.DB.prepare(
    'UPDATE "EmailLog" SET "status" = ?, "error" = ? WHERE "id" = ?'
  ).bind(status, error, logId).run();
}
export async function handleEmailQueue(batch: QueueBatch<EmailQueueMessage>, env: Env): Promise<void> {
  const dead = batch.queue === DEAD_QUEUE;
  for (const message of batch.messages) {
    const body = message.body;
    if (!body || typeof body.logId !== "string" || typeof body.to !== "string" ||
        typeof body.from !== "string" || typeof body.subject !== "string" ||
        typeof body.html !== "string" ||
        (body.attachments !== undefined && !Array.isArray(body.attachments)) ||
        new TextEncoder().encode(JSON.stringify(body)).byteLength > MAX_MESSAGE_BYTES) {
      console.error("[email-queue] invalid message; acknowledging");
      message.ack();
      continue;
    }
    try {
      const log = await env.DB.prepare(
        'SELECT "status", "error" FROM "EmailLog" WHERE "id" = ?'
      ).bind(body.logId).first<{status: string; error: string | null}>();
      if (!log) {
        console.error("[email-queue] email log not found", body.logId);
        message.ack();
        continue;
      }
      if (log.status === "sent" || log.status === "failed") {
        message.ack();
        continue;
      }
      if (dead) {
        await updateLog(env, body.logId, "failed",
          (log.error || "邮件任务超过最大重试次数") + "；已进入死信队列，请管理员检查");
        message.ack();
        continue;
      }
      await updateLog(env, body.logId, "sending", null);
      await wait(SEND_INTERVAL_MS);
      await sendToVps(body, env);
      await updateLog(env, body.logId, "sent", null);
      message.ack();
    } catch (error) {
      const detail = error instanceof Error ? error.message : "未知发送错误";
      const retryable = !(error instanceof DeliveryError) || error.retryable;
      if (retryable) {
        await updateLog(env, body.logId, "queued",
          ("第 " + message.attempts + " 次尝试失败：" + detail).slice(0, 500))
          .catch((dbError) => console.error("[email-queue] retry status update failed", dbError));
        const delaySeconds = Math.min(300, 5 * 2 ** Math.max(0, message.attempts - 1));
        message.retry({ delaySeconds });
      } else {
        await updateLog(env, body.logId, "failed", detail.slice(0, 500))
          .catch((dbError) => console.error("[email-queue] failed status update failed", dbError));
        message.ack();
      }
      console.error("[email-queue] VPS delivery attempt failed", {
        logId: body.logId, attempt: message.attempts, retryable, error: detail,
      });
    }
  }
}