"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { BrandLogo } from "@/components/brand-logo";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGitHubLogin() {
    if (loading) return;

    setError("");
    setLoading(true);

    try {
      await signIn("github", { callbackUrl: "/admin" });
    } catch {
      setLoading(false);
      setError("GitHub 授权启动失败，请稍后重试");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center">
          <BrandLogo size={48} showText href="/login" />
          <p className="mt-3 text-sm text-slate-500">MailHub 管理员登录</p>
        </div>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-7 shadow-xl shadow-slate-900/5 sm:p-9">
          <h1 className="text-center text-xl font-semibold text-slate-900">
            欢迎回来
          </h1>
          <p className="mt-2 text-center text-sm leading-6 text-slate-500">
            使用已授权的 GitHub 管理员账号安全登录
          </p>

          {error && (
            <div
              role="alert"
              aria-live="polite"
              className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600"
            >
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleGitHubLogin}
            disabled={loading}
            aria-busy={loading}
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl bg-slate-950 px-5 py-4 text-base font-semibold text-white shadow-lg shadow-slate-900/15 transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-400/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-6 w-6 fill-current"
              >
                <path d="M12 .9a11.1 11.1 0 0 0-3.51 21.63c.55.1.76-.24.76-.53v-2.08c-3.1.68-3.76-1.32-3.76-1.32-.5-1.29-1.24-1.63-1.24-1.63-1.01-.69.08-.68.08-.68 1.12.08 1.71 1.15 1.71 1.15 1 .1.77 2.2 3.48 1.66.1-.72.4-1.21.7-1.49-2.48-.28-5.09-1.24-5.09-5.53 0-1.22.44-2.22 1.15-3-.12-.28-.5-1.42.11-2.96 0 0 .94-.3 3.05 1.14a10.6 10.6 0 0 1 5.55 0c2.11-1.44 3.05-1.14 3.05-1.14.61 1.54.23 2.68.11 2.96.72.78 1.15 1.78 1.15 3 0 4.3-2.61 5.25-5.1 5.52.4.35.75 1.03.75 2.08V22c0 .29.2.63.76.52A11.1 11.1 0 0 0 12 .9Z" />
              </svg>
            )}
            {loading ? "正在跳转 GitHub..." : "使用 GitHub 账号登录"}
          </button>

          <p className="mt-6 text-center text-xs leading-5 text-slate-400">
            仅允许已授权的管理员 GitHub 账号访问
          </p>
        </section>
      </div>
    </main>
  );
}
