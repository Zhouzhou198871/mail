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
      keyPrefix: true,
      lastFour: true,
      status: true,
      createdAt: true,
      lastUsedAt: true,
    },
  });

  return NextResponse.json({ keys });
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const plaintext = generateApiKeyPlaintext();
  const keyHash = hashApiKey(plaintext);
  const keyPrefix = plaintext.slice(0, 12); // sk_live_xxxx
  const lastFour = plaintext.slice(-4);

  const created = await prisma.apiKey.create({
    data: {
      keyHash,
      keyPrefix,
      lastFour,
      userId: session.user.id,
      status: "active",
    },
    select: {
      id: true,
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
