import { getCloudflareContext } from "@opennextjs/cloudflare";
import { prisma } from "@/lib/prisma";

export interface EmailAttachment {
  filename: string;
  contentBase64: string;
  contentType?: string;
  disposition?: "attachment" | "inline";
  cid?: string;
}
export interface EmailQueueMessage {
  logId: string;
  to: string;
  from: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}
interface EmailQueueBinding {
  send(message: EmailQueueMessage, options?: { contentType?: "json" }): Promise<void>;
}
interface MailRuntimeEnv {
  EMAIL_QUEUE?: EmailQueueBinding;
  VPS_MAIL_FROM_EMAIL?: string;
}
export class EmailQueueError extends Error {
  constructor(message: string, public readonly statusCode = 500) {
    super(message);
    this.name = "EmailQueueError";
  }
}
export async function enqueueTransactionalEmail(params: {
  userId: string;
  to: string;
  subject: string;
  html: string;
  source: "api" | "panel";
  siteName: string;
  attachments?: EmailAttachment[];
}) {
  let env: MailRuntimeEnv | undefined;
  try {
    env = getCloudflareContext().env as unknown as MailRuntimeEnv;
  } catch {
    env = undefined;
  }
  const from = env?.VPS_MAIL_FROM_EMAIL || process.env.VPS_MAIL_FROM_EMAIL || "";
  if (!from) throw new EmailQueueError("发件人未配置，请设置 VPS_MAIL_FROM_EMAIL", 503);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(from.replace(/^.*<([^>]+)>.*$/, "$1").trim())) {
    throw new EmailQueueError("VPS_MAIL_FROM_EMAIL 格式不正确", 500);
  }

  const messageSize = new TextEncoder().encode(JSON.stringify({
    to: params.to, from, subject: params.subject, html: params.html,
    attachments: params.attachments || [],
  })).byteLength;
  if (messageSize > 120 * 1024) {
    throw new EmailQueueError("邮件内容及附件过大，单条队列任务不能超过 120 KiB", 413);
  }
  const queue = env?.EMAIL_QUEUE;
  if (!queue) throw new EmailQueueError("邮件队列暂不可用，请稍后重试", 503);

  const log = await prisma.emailLog.create({
    data: {
      userId: params.userId,
      to: params.to,
      subject: params.subject,
      status: "queued",
      source: params.source,
      siteName: params.siteName,
    },
    select: { id: true },
  });
  try {
    await queue.send({
      logId: log.id,
      to: params.to,
      from,
      subject: params.subject,
      html: params.html,
      ...(params.attachments?.length ? { attachments: params.attachments } : {}),
    }, { contentType: "json" });
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : "Queue publish failed";
    await prisma.emailLog.update({
      where: { id: log.id },
      data: { status: "failed", error: ("队列提交失败：" + detail).slice(0, 500) },
    }).catch(() => {});
    console.error("[email-queue] publish failed", error);
    throw new EmailQueueError("邮件任务提交失败，请稍后重试", 503);
  }
  return { id: log.id, status: "queued" as const };
}