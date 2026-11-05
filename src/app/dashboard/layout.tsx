import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { prisma } from "@/lib/prisma";

const nav = [
  { href: "/dashboard", label: "概览" },
  { href: "/dashboard/keys", label: "密钥" },
  { href: "/dashboard/logs", label: "发件" },
  { href: "/dashboard/domains", label: "域名" },
  { href: "/dashboard/settings", label: "设置" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  const isAdmin = session.user.email
    ? !!(await prisma.admin.findUnique({
        where: { email: session.user.email.toLowerCase() },
        select: { id: true },
      }))
    : false;

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-5xl px-3 py-4 sm:px-6 sm:py-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm">
          <BrandLogo href="/dashboard" size={40} subtitle="邮件调度中心" />

          <Link
            href="/dashboard/account"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 active:scale-[0.97]"
          >
            <span aria-hidden>👤</span>
            个人中心
          </Link>
        </div>

        <div className="mb-3 rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-sm">
          <nav className="flex flex-wrap gap-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-sky-50 hover:text-sky-700 active:scale-[0.97]"
              >
                {item.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/admin/payments"
                className="rounded-xl px-3.5 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-50"
              >
                晴天支付管理
              </Link>
            )}
          </nav>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
