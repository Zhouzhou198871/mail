import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { defaultFromEmail } from "@/lib/resend";
import { prisma } from "@/lib/prisma";
import { SettingsProviders } from "./settings-providers";
import Link from "next/link";
import { encryptSecret, isEncryptedSecret } from "@/lib/encryption";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const storedProviders = await prisma.senderProvider.findMany({
    orderBy: { createdAt: "desc" },
  });
  const providers = await Promise.all(
    storedProviders.map(async (provider) => {
      if (!isEncryptedSecret(provider.apiKey)) {
        await prisma.senderProvider.update({
          where: { id: provider.id },
          data: { apiKey: encryptSecret(provider.apiKey) },
        });
      }
      return provider;
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">设置</h1>
        <p className="mt-1 text-sm text-slate-500">发件通道管理（域名请到「域名」页）</p>
      </div>
      <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
        <p className="text-sm font-medium text-slate-700">系统默认发件人</p>
        <p className="mt-1 font-mono text-sm text-slate-900">{defaultFromEmail}</p>
        <p className="mt-1 text-xs text-slate-500">环境变量 RESEND_FROM_EMAIL</p>
      </div>
      <Link href="/dashboard/domains" className="btn-secondary inline-flex">
        前往域名 / DNS 管理 →
      </Link>
      <SettingsProviders
        providers={providers.map((p) => ({
          id: p.id,
          name: p.name,
          type: p.type,
          fromEmail: p.fromEmail,
          note: p.note,
          createdAt: p.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
