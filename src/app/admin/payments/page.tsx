import { redirect } from "next/navigation";
import { getPayAdminContext } from "@/lib/pay-admin";
import { PayAdminClient } from "./pay-admin-client";

export const dynamic = "force-dynamic";

export default async function PayAdminPage() {
  const context = await getPayAdminContext();
  if (!context.ok) redirect(context.status === 401 ? "/login" : "/dashboard");

  return (
    <main className="min-h-screen bg-slate-100 px-3 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-4 shadow-sm sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-600">MailHub · Unified Admin</p>
            <h1 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">晴天支付管理中心</h1>
            <p className="mt-1 text-sm text-slate-500">已通过管理员身份验证 · {context.admin.email}</p>
          </div>
          <a href="/dashboard" className="btn-secondary">返回邮件后台</a>
        </header>
        <PayAdminClient />
      </div>
    </main>
  );
}
