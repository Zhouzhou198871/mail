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

  const [todaySent, totalSent, activeKeys, apiCalls] = await Promise.all([
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
    prisma.emailLog.count({
      where: { userId: session.user.id, source: "api" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">概览</h1>
          <p className="mt-1 text-sm text-slate-500">发信用量与接口调用一览</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/logs"
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition active:scale-[0.97] hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
          >
            查看日志
          </Link>
          <Link
            href="/dashboard/keys"
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition active:scale-[0.97] hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
          >
            管理密钥
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="今日发件量" value={todaySent} accent="slate" />
        <StatCard label="累计发件" value={totalSent} accent="slate" />
        <StatCard label="生效密钥" value={activeKeys} accent="emerald" />
        <StatCard label="网站调用次数" value={apiCalls} accent="sky" />
      </div>

      <ComposeForm defaultTo={session.user.email || ""} />
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: "slate" | "emerald" | "sky";
}) {
  const valueClass =
    accent === "emerald"
      ? "text-emerald-600"
      : accent === "sky"
        ? "text-sky-600"
        : "text-slate-900";

  return (
    <div className="rounded-2xl border border-slate-100 bg-gradient-to-b from-white to-slate-50 px-3 py-4 text-center shadow-sm transition hover:shadow-md sm:px-4">
      <p className="text-[11px] font-medium text-slate-500 sm:text-xs">{label}</p>
      <p className={`mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl ${valueClass}`}>
        {value}
      </p>
    </div>
  );
}
