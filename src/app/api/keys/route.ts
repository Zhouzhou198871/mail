import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateApiKeyPlaintext, hashApiKey } from "@/lib/api-key";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const keys = await prisma.apiKey.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      lastFour: true,
      status: true,
      createdAt: true,
      lastUsedAt: true,
    },
  });

  return NextResponse.json({ keys });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  let name = "默认密钥";
  try {
    const body = await request.json();
    if (body?.name && typeof body.name === "string") {
      name = body.name.trim().slice(0, 40) || "默认密钥";
    }
  } catch {
    // empty body is ok
  }

  const plaintext = generateApiKeyPlaintext();
  const keyHash = hashApiKey(plaintext);
  const keyPrefix = plaintext.slice(0, 12);
  const lastFour = plaintext.slice(-4);

  const created = await prisma.apiKey.create({
    data: {
      name,
      keyHash,
      keyPrefix,
      lastFour,
      userId: session.user.id,
      status: "active",
    },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      lastFour: true,
      status: true,
      createdAt: true,
      lastUsedAt: true,
    },
  });

  return NextResponse.json({
    plaintext,
    key: {
      ...created,
      createdAt: created.createdAt.toISOString(),
      lastUsedAt: created.lastUsedAt?.toISOString() ?? null,
    },
  });
}
