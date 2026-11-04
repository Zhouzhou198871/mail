import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { enqueueTransactionalEmail, EmailQueueError } from "@/lib/email-queue";
import { MAIL_TEMPLATES, templateToHtml } from "@/lib/templates";

const bodySchema = z.object({
  to: z.string().email("收件人邮箱格式不正确"),
  templateId: z.string().min(1).optional(),
  subject: z.string().trim().min(1).max(200).optional(),
  html: z.string().min(1).max(100_000).optional(),
  attachments: z.array(z.object({
  filename: z.string().min(1).max(255),
  contentBase64: z.string().min(1).max(100_000),
  contentType: z.string().max(128).optional(),
  disposition: z.enum(["attachment", "inline"]).optional(),
  cid: z.string().max(255).optional(),
})).max(10).optional(),
}).superRefine((value, ctx) => {
  if (value.templateId) return;
  if (!value.subject || !value.html) ctx.addIssue({
    code: z.ZodIssueCode.custom,
    message: "请提供有效模版，或同时提供邮件主题和 HTML 正文",
  });
});
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json(
    { success: false, error: "未登录" }, { status: 401 }
  );

  let json: unknown;
  try { json = await request.json(); }
  catch { return NextResponse.json({ success: false, error: "请求体必须是 JSON" }, { status: 400 }); }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json(
    { success: false, error: parsed.error.errors[0]?.message || "参数错误" }, { status: 400 }
  );

  let subject: string;
  let html: string;
  if (parsed.data.templateId) {
    const tpl = MAIL_TEMPLATES.find((item) => item.id === parsed.data.templateId);
    if (!tpl) return NextResponse.json({ success: false, error: "模版不存在" }, { status: 400 });
    subject = tpl.subject;
    html = templateToHtml(tpl.body);
  } else {
    subject = parsed.data.subject!;
    html = parsed.data.html!;
  }

  try {
    const queued = await enqueueTransactionalEmail({
      userId: session.user.id,
      to: parsed.data.to,
      subject,
      html,
      attachments: parsed.data.attachments,
      source: "panel",
      siteName: "管理面板",
    });
    return NextResponse.json(
      { success: true, queued: true, status: queued.status, id: queued.id }, { status: 202 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "邮件任务提交失败";
    const status = error instanceof EmailQueueError ? error.statusCode : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
