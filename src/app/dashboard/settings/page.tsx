import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const sender = process.env.VPS_MAIL_FROM_EMAIL || "尚未配置 VPS_MAIL_FROM_EMAIL";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">设置</h1>
        <p className="mt-1 text-sm text-slate-500">自建发件服务器配置</p>
      </div>
      <div className="rounded-2xl border border-slate-100 bg-white p-4">
        <p className="text-sm font-medium text-slate-700">默认发件人</p>
        <p className="mt-1 font-mono text-sm text-slate-900">{sender}</p>
        <p className="mt-2 text-xs text-slate-500">由 Cloudflare Worker Secret / Variable：VPS_MAIL_FROM_EMAIL 提供</p>
      </div>
      <div className="rounded-2xl border border-sky-100 bg-sky-50/60 p-4">
        <p className="text-sm font-semibold text-sky-900">自建 VPS 发件通道</p>
        <p className="mt-1 text-sm text-sky-800">所有邮件先进入 Cloudflare Queues，再由 Consumer 通过 HTTPS 请求自建 VPS 邮件接口。API 地址和鉴权密钥只保存在 Worker 运行环境中。</p>
      </div>
      <Link href="/dashboard/domains" className="btn-secondary inline-flex">
        前往域名 / DNS 管理 →
      </Link>
    </div>
  );
}