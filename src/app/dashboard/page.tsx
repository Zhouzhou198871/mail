import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ComposeForm } from "./compose-form";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [todaySent, totalSent, activeKeys] = await Promise.all([
    prisma.emailLog.count({
      where: {
        userId: session.user.id,
        status: "sent",
        createdAt: { gte: startOfDay },
      },
    }),
    prisma.emailLog.count({
      where: { userId: session.user.id, status: "sent" },
    }),
    prisma.apiKey.count({
      where: { userId: session.user.id, status: "active" },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">✉️ 概览</h1>
        <p className="mt-2 text-slate-600">
          在网页上直接发信，或使用 API Key 对接其他网站。
        </p>
      </div>

      <ComposeForm defaultTo={session.user.email || ""} />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-6">
          <p className="text-sm text-slate-500">📧 今日已发邮件</p>
          <p className="mt-2 text-4xl font-bold tracking-tight text-slate-900">
            {todaySent}
          </p>
        </div>
        <div className="card p-6">
          <p className="text-sm text-slate-500">📬 累计总发件数</p>
          <p className="mt-2 text-4xl font-bold tracking-tight text-slate-900">
            {totalSent}
          </p>
        </div>
        <div className="card p-6">
          <p className="text-sm text-slate-500">🔑 生效中 API Key</p>
          <p className="mt-2 text-4xl font-bold tracking-tight text-emerald-600">
            {activeKeys}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/dashboard/logs" className="btn-secondary">
          查看发件日志
        </Link>
        <Link href="/dashboard/keys" className="btn-secondary">
          管理 API 密钥
        </Link>
        <Link href="/dashboard/settings" className="btn-secondary">
          发件配置
        </Link>
      </div>
    </div>
  );
}
