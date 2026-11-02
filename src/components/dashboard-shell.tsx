"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/dashboard", label: "概览" },
  { href: "/dashboard/keys", label: "API 密钥" },
  { href: "/dashboard/settings", label: "设置" },
];

export function DashboardShell({
  email,
  children,
}: {
  email?: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
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
            <span className="hidden text-sm text-slate-600 sm:inline">{email}</span>
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                formAction={async () => {
                  // handled by server action in layout
                }}
                className="hidden"
              />
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-8 px-4 py-8 sm:px-6">
        <aside className="hidden w-48 shrink-0 md:block">
          <nav className="space-y-1">
            {nav.map((item) => {
              const active =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-sky-50 text-sky-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
