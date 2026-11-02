import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function LogsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const logs = await prisma.emailLog.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">发件日志</h1>
      <p className="mt-2 text-slate-600">最近 100 条通过 API 发送的邮件记录。</p>

      <div className="card mt-6 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">收件人</th>
              <th className="px-4 py-3 font-medium">主题</th>
              <th className="px-4 py-3 font-medium">状态</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">时间</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                  暂无发件记录
                </td>
              </tr>
            )}
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-slate-50 last:border-0">
                <td className="px-4 py-3 text-slate-800">{log.to}</td>
                <td className="max-w-[200px] truncate px-4 py-3 text-slate-700">
                  {log.subject}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      log.status === "sent"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    {log.status === "sent" ? "成功" : "失败"}
                  </span>
                </td>
                <td className="hidden px-4 py-3 text-slate-500 sm:table-cell">
                  {log.createdAt.toLocaleString("zh-CN")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
