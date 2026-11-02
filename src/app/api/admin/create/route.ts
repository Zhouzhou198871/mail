import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { ensureBootstrapAdmins } from "@/lib/admins";

const schema = z.object({
  email: z.string().email("邮箱格式不正确"),
  password: z.string().min(6, "密码至少 6 位"),
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

    const email = parsed.data.email.toLowerCase().trim();
    const exists = await prisma.admin.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json({ error: "该邮箱已是管理员" }, { status: 400 });
    }

    const created = await prisma.admin.create({
      data: {
        email,
        passwordHash: hashPassword(parsed.data.password),
      },
      select: { id: true, email: true, createdAt: true },
    });

    return NextResponse.json({
      success: true,
      admin: {
        ...created,
        createdAt: created.createdAt.toISOString(),
      },
    });
  } catch (err) {
    console.error("[admin/create]", err);
    return NextResponse.json({ error: "添加失败" }, { status: 500 });
  }
}
