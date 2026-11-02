import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { encryptSecret } from "@/lib/encryption";
import { enforceRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  name: z.string().trim().min(1).max(80),
  type: z.enum(["resend", "smtp", "other"]),
  apiKey: z.string().min(8).max(4096),
  fromEmail: z.string().email().max(254),
  note: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  if (!(request.headers.get("content-type") || "").includes("application/json")) {
    return NextResponse.json({ error: "请求格式不正确" }, { status: 415 });
  }

  const allowed = await enforceRateLimit(
    "provider-create:" + session.user.id,
    10,
    10 * 60 * 1000
  );
  if (!allowed) {
    return NextResponse.json(
      { error: "操作过于频繁，请稍后重试" },
      { status: 429, headers: { "Retry-After": "600" } }
    );
  }

  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw, "utf8") > 16 * 1024) {
      return NextResponse.json({ error: "请求内容过大" }, { status: 413 });
    }
    const parsed = schema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "参数错误" },
        { status: 400 }
      );
    }

    const created = await prisma.senderProvider.create({
      data: {
        ...parsed.data,
        apiKey: encryptSecret(parsed.data.apiKey),
      },
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
  } catch (error) {
    console.error("[settings/providers] save failed", error);
    return NextResponse.json(
      { error: "发件通道保存失败，请检查加密配置" },
      { status: 500 }
    );
  }
}
