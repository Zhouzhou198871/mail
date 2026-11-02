import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { defaultFromEmail } from "@/lib/resend";
import { prisma } from "@/lib/prisma";
import { SettingsProviders } from "./settings-providers";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [providers, sites] = await Promise.all([
    prisma.senderProvider.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.siteBinding.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">设置</h1>
        <p className="mt-1 text-sm text-slate-500">发件通道、网站域名绑定</p>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
        <p className="text-sm font-medium text-slate-700">系统默认发件人</p>
        <p className="mt-1 font-mono text-sm text-slate-900">{defaultFromEmail}</p>
        <p className="mt-1 text-xs text-slate-500">环境变量 RESEND_FROM_EMAIL</p>
      </div>

      <SettingsProviders
        providers={providers.map((p) => ({
          id: p.id,
          name: p.name,
          type: p.type,
          fromEmail: p.fromEmail,
          note: p.note,
          createdAt: p.createdAt.toISOString(),
        }))}
        sites={sites.map((s) => ({
          id: s.id,
          siteName: s.siteName,
          domain: s.domain,
          createdAt: s.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
