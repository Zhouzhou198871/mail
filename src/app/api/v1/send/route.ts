import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyApiKeyFromRequest } from "@/lib/api-key";
import { sendTransactionalEmail } from "@/lib/resend";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit, getClientIp } from "@/lib/rate-limit";

const MAX_BODY_BYTES = 256 * 1024;
const bodySchema = z.object({
  to: z.string().email("收件人邮箱格式不正确").max(254),
  subject: z.string().trim().min(1, "主题不能为空").max(200),
  html: z.string().min(1, "邮件内容不能为空").max(100_000),
});

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const attemptAllowed = await enforceRateLimit("send-attempt-ip:" + ip, 60, 60 * 1000);
  if (!attemptAllowed) {
    return NextResponse.json(
      { success: false, error: "请求过于频繁，请稍后重试" },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  const authResult = await verifyApiKeyFromRequest(request);
  if (!authResult.ok || !authResult.userId || !authResult.apiKeyId) {
    return NextResponse.json(
      { success: false, error: authResult.error || "未授权" },
      { status: 401 }
    );
  }

  const [keyAllowed, ipAllowed] = await Promise.all([
    enforceRateLimit("send-key:" + authResult.apiKeyId, 30, 60 * 1000),
    enforceRateLimit("send-ip:" + ip, 120, 60 * 1000),
  ]);
  if (!keyAllowed || !ipAllowed) {
    return NextResponse.json(
      { success: false, error: "请求过于频繁，请稍后重试" },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  if (!(request.headers.get("content-type") || "").includes("application/json")) {
    return NextResponse.json(
      { success: false, error: "Content-Type 必须为 application/json" },
      { status: 415 }
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
      { success: false, error: "请求体必须是有效 JSON" },
      { status: 400 }
    );
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.errors[0]?.message || "参数错误" },
      { status: 400 }
    );
  }

  const { to, subject, html } = parsed.data;
  const key = await prisma.apiKey.findUnique({
    where: { id: authResult.apiKeyId },
    select: { name: true },
  });
  const siteName = key?.name || "API";

  try {
    const data = await sendTransactionalEmail({ to, subject, html });
    const resendId =
      data && typeof data === "object" && "id" in data
        ? String((data as { id: string }).id)
        : null;
    await prisma.emailLog.create({
      data: {
        userId: authResult.userId,
        to,
        subject,
        status: "sent",
        source: "api",
        siteName,
        resendId,
      },
    });
    return NextResponse.json({ success: true, id: resendId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "发送失败";
    await prisma.emailLog.create({
      data: {
        userId: authResult.userId,
        to,
        subject,
        status: "failed",
        source: "api",
        siteName,
        error: message.slice(0, 500),
      },
    }).catch(() => {});
    console.error("[api/v1/send] delivery failed", err);
    return NextResponse.json(
      { success: false, error: "邮件发送失败，请查看发件记录" },
      { status: 502 }
    );
  }
}
