import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { ensureBootstrapAdmins } from "@/lib/admins";

const schema = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(6, "新密码至少 6 位"),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  await ensureBootstrapAdmins();

  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "参数错误" },
        { status: 400 }
      );
    }

    const email = session.user.email.toLowerCase();
    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) {
      return NextResponse.json({ error: "账号不存在" }, { status: 404 });
    }

    if (!verifyPassword(parsed.data.oldPassword, admin.passwordHash)) {
      return NextResponse.json({ error: "当前密码不正确" }, { status: 400 });
    }

    await prisma.admin.update({
      where: { email },
      data: { passwordHash: hashPassword(parsed.data.newPassword) },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[change-password]", err);
    return NextResponse.json({ error: "修改失败" }, { status: 500 });
  }
}
