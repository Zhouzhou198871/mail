import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { id } = await context.params;

  const existing = await prisma.apiKey.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "密钥不存在" }, { status: 404 });
  }

  await prisma.apiKey.update({
    where: { id },
    data: { status: "revoked" },
  });

  return NextResponse.json({ success: true });
}
