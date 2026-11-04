import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyApiKeyFromRequest } from "@/lib/api-key";
import { enqueueTransactionalEmail, EmailQueueError } from "@/lib/email-queue";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit, getClientIp } from "@/lib/rate-limit";

const MAX_BODY_BYTES = 256 * 1024;
const bodySchema = z.object({
  to: z.string().email("收件人邮箱格式不正确").max(254),
  subject: z.string().trim().min(1, "主题不能为空").max(200),
  html: z.string().min(1, "邮件内容不能为空").max(100_000),
  attachments: z.array(z.object({
  filename: z.string().min(1).max(255),
  contentBase64: z.string().min(1).max(100_000),
  contentType: z.string().max(128).optional(),
  disposition: z.enum(["attachment", "inline"]).optional(),
  cid: z.string().max(255).optional(),
})).max(10).optional(),
});
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const attemptAllowed = await enforceRateLimit("send-attempt-ip:" + ip, 60, 60 * 1000);
  if (!attemptAllowed) return NextResponse.json(
    { success: false, error: "请求过于频繁，请稍后重试" },
    { status: 429, headers: { "Retry-After": "60" } }
  );

  const authResult = await verifyApiKeyFromRequest(request);
  if (!authResult.ok || !authResult.userId || !authResult.apiKeyId) {
    return NextResponse.json(
      { success: false, error: authResult.error || "未授权" }, { status: 401 }
    );
  }

  const [keyAllowed, ipAllowed] = await Promise.all([
    enforceRateLimit("send-key:" + authResult.apiKeyId, 600, 60 * 1000),
    enforceRateLimit("send-ip:" + ip, 1200, 60 * 1000),
  ]);
  if (!keyAllowed || !ipAllowed) return NextResponse.json(
    { success: false, error: "请求过于频繁，请稍后重试" },
    { status: 429, headers: { "Retry-After": "60" } }
  );

  if (!(request.headers.get("content-type") || "").includes("application/json")) {
    return NextResponse.json(
      { success: false, error: "Content-Type 必须为 application/json" }, { status: 415 }
    );
  }
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ success: false, error: "请求内容过大" }, { status: 413 });
  }

  let json: unknown;
  try {
    const rawBody = await request.text();
    if (Buffer.byteLength(rawBody, "utf8") > MAX_BODY_BYTES) {
      return NextResponse.json({ success: false, error: "请求内容过大" }, { status: 413 });
    }
    json = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { success: false, error: "请求体必须是有效 JSON" }, { status: 400 }
    );
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json(
    { success: false, error: parsed.error.errors[0]?.message || "参数错误" }, { status: 400 }
  );

  const key = await prisma.apiKey.findUnique({
    where: { id: authResult.apiKeyId }, select: { name: true },
  });
  try {
    const queued = await enqueueTransactionalEmail({
      userId: authResult.userId,
      to: parsed.data.to,
      subject: parsed.data.subject,
      html: parsed.data.html,
      attachments: parsed.data.attachments,
      source: "api",
      siteName: key?.name || "API",
    });
    return NextResponse.json(
      { success: true, queued: true, status: queued.status, id: queued.id }, { status: 202 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "邮件任务提交失败";
    const status = error instanceof EmailQueueError ? error.statusCode : 500;
    console.error("[api/v1/send] queue publish failed", error);
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
