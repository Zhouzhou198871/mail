import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { OverviewStats } from "./overview-stats";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [todayLogs, allLogs, keys, sites] = await Promise.all([
    prisma.emailLog.findMany({
      where: {
        userId: session.user.id,
        status: "sent",
        createdAt: { gte: startOfDay },
      },
      select: { siteName: true, createdAt: true },
    }),
    prisma.emailLog.findMany({
      where: { userId: session.user.id, status: "sent" },
      select: { siteName: true, createdAt: true },
    }),
    prisma.apiKey.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        lastFour: true,
        createdAt: true,
        status: true,
      },
    }),
    prisma.siteBinding.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  const groupBySite = (rows: { siteName: string | null }[]) => {
    const map = new Map<string, number>();
    for (const r of rows) {
      const name = r.siteName || "未命名";
      map.set(name, (map.get(name) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  };

  const todayLabel = startOfDay.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">概览</h1>
        <p className="mt-1 text-sm text-slate-500">点击卡片查看明细 · {todayLabel}</p>
      </div>

      <OverviewStats
        todayLabel={todayLabel}
        todayTotal={todayLogs.length}
        todayBySite={groupBySite(todayLogs)}
        allTotal={allLogs.length}
        allBySite={groupBySite(allLogs)}
        keys={keys.map((k) => ({
          id: k.id,
          name: k.name,
          mask: `${k.keyPrefix}...${k.lastFour}`,
          createdAt: k.createdAt.toISOString(),
          status: k.status,
        }))}
        sites={sites.map((s) => ({
          id: s.id,
          siteName: s.siteName,
          domain: s.domain,
          createdAt: s.createdAt.toISOString(),
        }))}
        siteCount={Math.max(sites.length, keys.length)}
      />
    </div>
  );
}
