import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyApiKeyFromRequest } from "@/lib/api-key";
import { sendTransactionalEmail } from "@/lib/resend";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  to: z.string().email("收件人邮箱格式不正确"),
  subject: z.string().min(1, "主题不能为空").max(200),
  html: z.string().min(1, "邮件内容不能为空"),
});

export async function POST(request: Request) {
  const authResult = await verifyApiKeyFromRequest(request);
  if (!authResult.ok || !authResult.userId) {
    return NextResponse.json(
      { success: false, error: authResult.error || "未授权" },
      { status: 401 }
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "请求体必须是 JSON" },
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
        resendId,
      },
    });

    return NextResponse.json({ success: true, id: resendId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "发送失败";

    await prisma.emailLog
      .create({
        data: {
          userId: authResult.userId,
          to,
          subject,
          status: "failed",
          error: message.slice(0, 500),
        },
      })
      .catch(() => {});

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
