import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TemplateSendForm } from "./template-send-form";

export default async function LogsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const logs = await prisma.emailLog.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">发件</h1>
        <p className="mt-1 text-sm text-slate-500">邮件进入队列后异步发送 · 状态自动更新</p>
      </div>

      <TemplateSendForm defaultTo={session.user.email || ""} />

      <div className="overflow-hidden rounded-2xl border border-slate-100">
        <div className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600">
          最近发件记录
        </div>
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-white text-slate-500">
            <tr>
              <th className="px-3 py-3 font-medium">收件人</th>
              <th className="px-3 py-3 font-medium">主题</th>
              <th className="px-3 py-3 font-medium">来源</th>
              <th className="px-3 py-3 font-medium">状态</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">时间</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                  暂无发件记录
                </td>
              </tr>
            )}
            {logs.map((log) => {
              const queued = log.status === "queued" || log.status === "sending";
              const sent = log.status === "sent";
              return (
              <tr key={log.id} className="border-b border-slate-50 last:border-0">
                <td className="px-3 py-3 text-slate-800">{log.to}</td>
                <td className="max-w-[120px] truncate px-3 py-3 text-slate-700">
                  {log.subject}
                </td>
                <td className="px-3 py-3">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    {log.siteName || (log.source === "api" ? "API" : "面板")}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      sent
                        ? "bg-emerald-50 text-emerald-700"
                        : queued
                          ? "bg-amber-50 text-amber-700"
                          : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    {sent ? "已发送" : queued ? "排队中" : "失败"}
                  </span>
                </td>
                <td className="hidden px-4 py-3 text-slate-500 sm:table-cell">
                  {log.createdAt.toLocaleString("zh-CN")}
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
