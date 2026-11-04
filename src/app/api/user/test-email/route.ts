import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { enqueueTransactionalEmail, EmailQueueError } from "@/lib/email-queue";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });
  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, notificationEmail: true },
    });
    if (!user) return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    const to = (user.notificationEmail || user.email).toLowerCase().trim();
    const queued = await enqueueTransactionalEmail({
      userId: session.user.id,
      to,
      subject: "【MailHub】测试邮件",
      html: "<p>这是一封来自 MailHub 的测试邮件。若你收到此信，说明邮件通道工作正常。</p>",
      source: "panel",
      siteName: "测试邮件",
    });
    return NextResponse.json(
      { success: true, queued: true, id: queued.id, to }, { status: 202 }
    );
  } catch (error) {
    console.error("[user/test-email]", error);
    const message = error instanceof Error ? error.message : "邮件任务提交失败";
    const status = error instanceof EmailQueueError ? error.statusCode : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
