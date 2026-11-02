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
      name: true,
      keyPrefix: true,
      lastFour: true,
      status: true,
      createdAt: true,
      lastUsedAt: true,
    },
  });

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">API 密钥</h1>
      <p className="mt-1 text-sm text-slate-500">
        为每个对接站点起一个昵称，方便识别与吊销。
      </p>
      <KeysClient
        initialKeys={keys.map((k) => ({
          ...k,
          name: k.name || "默认密钥",
          createdAt: k.createdAt.toISOString(),
          lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
        }))}
      />
    </div>
  );
}
