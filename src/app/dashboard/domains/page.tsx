import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DomainsClient } from "./domains-client";

export default async function DomainsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const sites = await prisma.siteBinding.findMany({
    orderBy: { createdAt: "desc" },
  });

  const hasCf = Boolean(process.env.CF_API_TOKEN && process.env.CF_ACCOUNT_ID);
  const hasDnshe = Boolean(
    process.env.DNSHE_API_ID || process.env.DNSHE_API_TOKEN || process.env.DNSPOD_TOKEN
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">域名</h1>
        <p className="mt-1 text-sm text-slate-500">
          发件域名绑定 · Cloudflare / DNShe 解析状态
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="stat-card">
          <p className="stat-label">已绑定域名</p>
          <p className="stat-value text-slate-900">{sites.length}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Cloudflare</p>
          <p className={`stat-value ${hasCf ? "text-emerald-600" : "text-slate-400"}`}>
            {hasCf ? "已配置" : "未配置"}
          </p>
        </div>
        <div className="stat-card">
          <p className="stat-label">DNShe / DNSPod</p>
          <p className={`stat-value ${hasDnshe ? "text-emerald-600" : "text-slate-400"}`}>
            {hasDnshe ? "已配置" : "未配置"}
          </p>
        </div>
      </div>

      <DomainsClient
        initialSites={sites.map((s) => ({
          id: s.id,
          siteName: s.siteName,
          domain: s.domain,
          createdAt: s.createdAt.toISOString(),
        }))}
        hasCf={hasCf}
        hasDnshe={hasDnshe}
      />
    </div>
  );
}
