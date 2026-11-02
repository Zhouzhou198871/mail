import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  siteName: z.string().min(1).max(80),
  domain: z.string().min(1).max(200),
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

  const created = await prisma.siteBinding.create({
    data: parsed.data,
  });

  return NextResponse.json({
    site: {
      id: created.id,
      siteName: created.siteName,
      domain: created.domain,
      createdAt: created.createdAt.toISOString(),
    },
  });
}
