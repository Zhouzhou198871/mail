"use client";

import Link from "next/link";
import { useState } from "react";
import { PayAdminClient } from "@/app/admin/payments/pay-admin-client";

const mailNav = [
  { href: "/dashboard", label: "概览" },
  { href: "/dashboard/keys", label: "密钥" },
  { href: "/dashboard/logs", label: "日志" },
  { href: "/dashboard/domains", label: "域名" },
  { href: "/dashboard/settings", label: "设置" },
];

export function DashboardShell({
  children,
  isAdmin,
}: {
  children: React.ReactNode;
  isAdmin: boolean;
}) {
  const [activeView, setActiveView] = useState<"mail" | "payments">("mail");

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-5xl px-3 py-4 sm:px-6 sm:py-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm">
          <Link href="/dashboard" onClick={() => setActiveView("mail")} className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-sky-600 text-lg font-black text-white">M</span>
            <span>
              <span className="block text-base font-bold tracking-tight text-slate-900">MailHub</span>
              <span className="block text-[11px] text-slate-500">邮件调度中心</span>
            </span>
          </Link>

          <Link
            href="/dashboard/account"
            onClick={() => setActiveView("mail")}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 active:scale-[0.97]"
          >
            <span aria-hidden>👤</span>
            个人中心
          </Link>
        </div>

        <div className="mb-3 rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-sm">
          <nav className="flex flex-wrap gap-1" aria-label="MailHub 主导航">
            {mailNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setActiveView("mail")}
                className="rounded-xl px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-sky-50 hover:text-sky-700 active:scale-[0.97]"
              >
                {item.label}
              </Link>
            ))}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setActiveView("payments")}
                aria-pressed={activeView === "payments"}
                className={`rounded-xl px-3.5 py-2 text-sm font-semibold transition active:scale-[0.97] ${
                  activeView === "payments"
                    ? "bg-sky-600 text-white shadow-sm"
                    : "text-sky-700 hover:bg-sky-50"
                }`}
              >
                支付管理
              </button>
            )}
          </nav>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-6">
          {activeView === "payments" && isAdmin ? <PayAdminClient /> : children}
        </div>
      </div>
    </div>
  );
}
