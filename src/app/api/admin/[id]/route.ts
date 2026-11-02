import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { id } = await context.params;
  const target = await prisma.admin.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json({ error: "管理员不存在" }, { status: 404 });
  }

  if (target.email === session.user.email.toLowerCase()) {
    return NextResponse.json({ error: "不能删除当前登录账号" }, { status: 400 });
  }

  await prisma.admin.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
