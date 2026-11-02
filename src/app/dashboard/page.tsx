import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500 text-sm font-bold text-white">
              晴
            </div>
            <div>
              <p className="font-semibold text-slate-900">晴天支付</p>
              <p className="text-xs text-slate-500">商户控制台</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-slate-600 sm:inline">
              {session.user.email}
            </span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button
                type="submit"
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                退出登录
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-bold text-slate-900">欢迎回来</h1>
        <p className="mt-2 text-slate-600">
          您已成功登录晴天支付商户平台。后续可在此管理 API Key、查看交易与提现。
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="card p-5">
            <p className="text-sm text-slate-500">账户邮箱</p>
            <p className="mt-1 font-medium text-slate-900">{session.user.email}</p>
          </div>
          <div className="card p-5">
            <p className="text-sm text-slate-500">用户 ID</p>
            <p className="mt-1 break-all font-mono text-sm text-slate-900">
              {session.user.id}
            </p>
          </div>
          <div className="card p-5">
            <p className="text-sm text-slate-500">状态</p>
            <p className="mt-1 font-medium text-emerald-600">已认证</p>
          </div>
        </div>

        <div className="mt-8">
          <Link href="/" className="text-sm font-medium text-sky-600 hover:underline">
            ← 返回首页
          </Link>
        </div>
      </main>
    </div>
  );
}
