import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  notificationEmail: z.string().email("邮箱格式不正确"),
  receiveEmailAlerts: z.boolean(),
});

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "参数错误" },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        notificationEmail: parsed.data.notificationEmail.toLowerCase().trim(),
        receiveEmailAlerts: parsed.data.receiveEmailAlerts,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[user/settings]", err);
    return NextResponse.json({ error: "保存失败" }, { status: 500 });
  }
}
