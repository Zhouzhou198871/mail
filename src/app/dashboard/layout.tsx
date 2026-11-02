import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

const nav = [
  { href: "/dashboard", label: "概览", exact: true },
  { href: "/dashboard/keys", label: "API 密钥", exact: false },
  { href: "/dashboard/settings", label: "设置", exact: false },
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

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500 text-sm font-bold text-white">
              晴
            </div>
            <div>
              <p className="font-semibold text-slate-900">晴天支付</p>
              <p className="text-xs text-slate-500">商户控制台</p>
            </div>
          </Link>

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

      <div className="mx-auto flex max-w-6xl gap-8 px-4 py-8 sm:px-6">
        <aside className="hidden w-48 shrink-0 md:block">
          <nav className="space-y-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-8 border-t border-slate-200 pt-4">
            <Link href="/" className="text-sm text-sky-600 hover:underline">
              ← 返回首页
            </Link>
          </div>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
