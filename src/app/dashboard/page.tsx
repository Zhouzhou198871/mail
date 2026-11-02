import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
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
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">概览</h1>
        <p className="mt-1 text-sm text-slate-500">网页发信 · API 对接 · 用量一览</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="rounded-xl bg-slate-50 px-3 py-3 text-center sm:px-4 sm:py-4">
          <p className="text-[11px] text-slate-500 sm:text-xs">今日已发</p>
          <p className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">{todaySent}</p>
        </div>
        <div className="rounded-xl bg-slate-50 px-3 py-3 text-center sm:px-4 sm:py-4">
          <p className="text-[11px] text-slate-500 sm:text-xs">累计发件</p>
          <p className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">{totalSent}</p>
        </div>
        <div className="rounded-xl bg-slate-50 px-3 py-3 text-center sm:px-4 sm:py-4">
          <p className="text-[11px] text-slate-500 sm:text-xs">生效密钥</p>
          <p className="mt-1 text-xl font-bold text-emerald-600 sm:text-2xl">{activeKeys}</p>
        </div>
      </div>

      <ComposeForm defaultTo={session.user.email || ""} />
    </div>
  );
}
