import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

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
    <div>
      <h1 className="text-2xl font-bold text-slate-900">概览</h1>
      <p className="mt-2 text-slate-600">
        通过 API Key 调用发件接口，在此查看用量与密钥状态。
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <p className="text-sm text-slate-500">今日已发邮件</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">{todaySent}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-slate-500">累计成功发送</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">{totalSent}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-slate-500">生效中 API 密钥</p>
          <p className="mt-1 text-3xl font-bold text-emerald-600">{activeKeys}</p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/dashboard/keys" className="btn-primary">
          管理 API 密钥
        </Link>
        <Link href="/dashboard/logs" className="btn-secondary">
          查看发件日志
        </Link>
        <Link href="/dashboard/settings" className="btn-secondary">
          测试发件 API
        </Link>
      </div>
    </div>
  );
}
