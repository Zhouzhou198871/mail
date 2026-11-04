interface D1Statement {
  bind(...values: unknown[]): D1Statement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<unknown>;
}
interface D1Database { prepare(sql: string): D1Statement; }
interface EmailQueueMessage { logId: string; to: string; subject: string; html: string; }
interface QueueMessage<T> {
  body: T; attempts: number; ack(): void;
  retry(options?: { delaySeconds?: number }): void;
}
interface QueueBatch<T> { queue: string; messages: QueueMessage<T>[]; }
interface Env {
  DB: D1Database;
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
  SENDGRID_API_KEY?: string;
  SENDGRID_FROM_EMAIL?: string;
}
const MAIN_QUEUE = "mailhub-email";
const DEAD_QUEUE = "mailhub-email-dead";
const MAX_MESSAGE_BYTES = 120 * 1024;
const SEND_INTERVAL_MS = 125;

class DeliveryError extends Error {
  constructor(message: string, public readonly retryable: boolean, public readonly uncertain = false) {
    super(message);
    this.name = "DeliveryError";
  }
}
const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
function errorText(payload: unknown): string {
  if (payload && typeof payload === "object") {
    const item = payload as Record<string, unknown>;
    if (typeof item.message === "string") return item.message;
    if (typeof item.error === "string") return item.error;
  }
  return JSON.stringify(payload).slice(0, 300);
}
async function sendResend(message: EmailQueueMessage, env: Env): Promise<string | null> {
  if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL) {
    throw new DeliveryError("Resend 未配置 RESEND_API_KEY 或 RESEND_FROM_EMAIL", false);
  }
  let response: Response;
  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: \`Bearer \${env.RESEND_API_KEY}\`,
        "Content-Type": "application/json",
        "Idempotency-Key": message.logId,
      },
      body: JSON.stringify({
        from: \`MailHub <\${env.RESEND_FROM_EMAIL}>\`,
        to: [message.to],
        subject: message.subject,
        html: message.html,
      }),
    });
  } catch (error) {
    throw new DeliveryError(
      "Resend 网络请求异常：" + (error instanceof Error ? error.message : "network error"),
      true, true
    );
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const concurrent409 = response.status === 409 &&
      JSON.stringify(payload).includes("concurrent_idempotent_requests");
    const retryable = response.status === 408 || response.status === 429 ||
      response.status >= 500 || concurrent409;
    throw new DeliveryError("Resend HTTP " + response.status + ": " + errorText(payload), retryable);
  }
  return payload && typeof payload.id === "string" ? payload.id : null;
}
async function sendSendGrid(message: EmailQueueMessage, env: Env): Promise<string | null> {
  const fromEmail = env.SENDGRID_FROM_EMAIL || env.RESEND_FROM_EMAIL;
  if (!env.SENDGRID_API_KEY || !fromEmail) {
    throw new DeliveryError("SendGrid 未配置 API Key 或发件地址", false);
  }
  let response: Response;
  try {
    response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: \`Bearer \${env.SENDGRID_API_KEY}\`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: message.to }],
          custom_args: { mailhub_log_id: message.logId },
        }],
        from: { email: fromEmail, name: "MailHub" },
        subject: message.subject,
        content: [{ type: "text/html", value: message.html }],
      }),
    });
  } catch (error) {
    throw new DeliveryError(
      "SendGrid 网络请求异常：" + (error instanceof Error ? error.message : "network error"),
      true, true
    );
  }
  if (response.status !== 202 && !response.ok) {
    const detail = (await response.text().catch(() => "")).slice(0, 300);
    const retryable = response.status === 408 || response.status === 429 || response.status >= 500;
    throw new DeliveryError("SendGrid HTTP " + response.status + ": " + detail, retryable);
  }
  const id = response.headers.get("x-message-id");
  return id ? "sendgrid:" + id : "sendgrid:" + message.logId;
}
async function deliver(message: EmailQueueMessage, env: Env): Promise<string | null> {
  if (env.RESEND_API_KEY && env.RESEND_FROM_EMAIL) {
    try {
      return await sendResend(message, env);
    } catch (error) {
      if (!(error instanceof DeliveryError)) throw error;
      // Rate limits, 5xx and network ambiguity retry Resend with the same key.
      if (error.retryable || error.uncertain) throw error;
      console.error("[email-queue] Resend permanent error; trying SendGrid", error.message);
      if (!env.SENDGRID_API_KEY) throw error;
    }
  }
  if (env.SENDGRID_API_KEY) return sendSendGrid(message, env);
  throw new DeliveryError("没有可用发件通道，请配置 Resend 或 SendGrid", false);
}
async function updateLog(
  env: Env, logId: string, status: string, providerId: string | null, error: string | null
): Promise<void> {
  await env.DB.prepare(
    'UPDATE "EmailLog" SET "status" = ?, "resendId" = ?, "error" = ? WHERE "id" = ?'
  ).bind(status, providerId, error, logId).run();
}
export async function handleEmailQueue(batch: QueueBatch<EmailQueueMessage>, env: Env): Promise<void> {
  const dead = batch.queue === DEAD_QUEUE;
  for (const message of batch.messages) {
    const body = message.body;
    if (!body || typeof body.logId !== "string" || typeof body.to !== "string" ||
        typeof body.subject !== "string" || typeof body.html !== "string" ||
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
        await updateLog(env, body.logId, "failed", null,
          (log.error || "邮件任务超过最大重试次数") + "；已进入死信队列，请管理员检查");
        message.ack();
        continue;
      }
      await updateLog(env, body.logId, "sending", null, null);
      await wait(SEND_INTERVAL_MS);
      const providerId = await deliver(body, env);
      await updateLog(env, body.logId, "sent", providerId, null);
      message.ack();
    } catch (error) {
      const detail = error instanceof Error ? error.message : "未知发送错误";
      const retryable = !(error instanceof DeliveryError) || error.retryable;
      if (retryable) {
        await updateLog(env, body.logId, "queued", null,
          ("第 " + message.attempts + " 次尝试失败：" + detail).slice(0, 500))
          .catch((dbError) => console.error("[email-queue] retry status update failed", dbError));
        const delaySeconds = Math.min(300, 5 * 2 ** Math.max(0, message.attempts - 1));
        message.retry({ delaySeconds });
      } else {
        await updateLog(env, body.logId, "failed", null, detail.slice(0, 500))
          .catch((dbError) => console.error("[email-queue] failed status update failed", dbError));
        message.ack();
      }
      console.error("[email-queue] delivery attempt failed", {
        logId: body.logId, attempt: message.attempts, retryable, error: detail,
      });
    }
  }
}
