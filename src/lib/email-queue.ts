import { getCloudflareContext } from "@opennextjs/cloudflare";
import { prisma } from "@/lib/prisma";

export interface EmailQueueMessage {
  logId: string;
  to: string;
  subject: string;
  html: string;
}
interface EmailQueueBinding {
  send(message: EmailQueueMessage, options?: { contentType?: "json" }): Promise<void>;
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
}) {
  const size = new TextEncoder().encode(JSON.stringify({
    to: params.to, subject: params.subject, html: params.html,
  })).byteLength;
  if (size > 120 * 1024) {
    throw new EmailQueueError("邮件内容过大，单条队列任务不能超过 120 KiB", 413);
  }
  let queue: EmailQueueBinding | undefined;
  try {
    const { env } = getCloudflareContext();
    queue = (env as unknown as { EMAIL_QUEUE?: EmailQueueBinding }).EMAIL_QUEUE;
  } catch {
    queue = undefined;
  }
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
      logId: log.id, to: params.to, subject: params.subject, html: params.html,
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
