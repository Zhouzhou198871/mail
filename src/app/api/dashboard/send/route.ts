import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendTransactionalEmail } from "@/lib/resend";
import { MAIL_TEMPLATES, templateToHtml } from "@/lib/templates";

const bodySchema = z.object({
  to: z.string().email("收件人邮箱格式不正确"),
  templateId: z.string().min(1),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "请求体必须是 JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.errors[0]?.message || "参数错误" },
      { status: 400 }
    );
  }

  const tpl = MAIL_TEMPLATES.find((t) => t.id === parsed.data.templateId);
  if (!tpl) {
    return NextResponse.json({ success: false, error: "模版不存在" }, { status: 400 });
  }

  const to = parsed.data.to;
  const subject = tpl.subject;
  const html = templateToHtml(tpl.body);

  try {
    const data = await sendTransactionalEmail({ to, subject, html });
    const resendId =
      data && typeof data === "object" && "id" in data
        ? String((data as { id: string }).id)
        : null;

    await prisma.emailLog.create({
      data: {
        userId: session.user.id,
        to,
        subject,
        status: "sent",
        source: "panel",
        siteName: "管理面板",
        resendId,
      },
    });

    return NextResponse.json({ success: true, id: resendId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "发送失败";
    await prisma.emailLog
      .create({
        data: {
          userId: session.user.id,
          to,
          subject,
          status: "failed",
          source: "panel",
          siteName: "管理面板",
          error: message.slice(0, 500),
        },
      })
      .catch(() => {});
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
