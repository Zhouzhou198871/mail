import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendTransactionalEmail } from "@/lib/resend";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        email: true,
        notificationEmail: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    const to = (user.notificationEmail || user.email).toLowerCase().trim();
    await sendTransactionalEmail({
      to,
      subject: "【MailHub】测试邮件",
      html: "<p>这是一封来自 MailHub 的测试邮件。若你收到此信，说明邮件通道工作正常。</p>",
    });

    return NextResponse.json({ success: true, to });
  } catch (err: unknown) {
    console.error("[user/test-email]", err);
    const message = err instanceof Error ? err.message : "发送失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
