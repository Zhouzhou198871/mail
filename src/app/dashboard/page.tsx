import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DemoApiTester } from "./demo-api-tester";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [keyCount, activeKeys] = await Promise.all([
    prisma.apiKey.count({ where: { userId: session.user.id } }),
    prisma.apiKey.count({
      where: { userId: session.user.id, status: "active" },
    }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">概览</h1>
      <p className="mt-2 text-slate-600">
        管理 API 密钥、测试接口与通知设置。
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <p className="text-sm text-slate-500">账户邮箱</p>
          <p className="mt-1 font-medium text-slate-900">{session.user.email}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-slate-500">API 密钥总数</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{keyCount}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-slate-500">生效中</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{activeKeys}</p>
        </div>
      </div>

      <div className="card mt-8 p-6">
        <h2 className="text-lg font-semibold text-slate-900">测试接口</h2>
        <p className="mt-1 text-sm text-slate-500">
          使用您的 API Key 请求 <code className="rounded bg-slate-100 px-1">/api/v1/demo</code> 验证鉴权是否正常。
        </p>
        <DemoApiTester />
      </div>
    </div>
  );
}
