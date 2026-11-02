import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(1).max(80),
  type: z.string().min(1).max(40),
  apiKey: z.string().min(1),
  fromEmail: z.string().email(),
  note: z.string().optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "参数错误" }, { status: 400 });
  }

  const created = await prisma.senderProvider.create({
    data: parsed.data,
  });

  return NextResponse.json({
    provider: {
      id: created.id,
      name: created.name,
      type: created.type,
      fromEmail: created.fromEmail,
      note: created.note,
      createdAt: created.createdAt.toISOString(),
    },
  });
}
