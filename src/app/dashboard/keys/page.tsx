import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { KeysClient } from "./keys-client";

export default async function KeysPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

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

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">API 密钥</h1>
      <p className="mt-2 text-slate-600">
        用于调用发件接口（POST /api/v1/send）的 API 密钥。密钥仅在创建时展示一次明文。
      </p>
      <KeysClient
        initialKeys={keys.map((k) => ({
          ...k,
          createdAt: k.createdAt.toISOString(),
          lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
        }))}
      />
    </div>
  );
}
