"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { BrandLogo } from "@/components/brand-logo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loadingSend, setLoadingSend] = useState(false);
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  async function handleSendCode() {
    setError("");
    setMessage("");
    const trimmed = email.trim().toLowerCase();

    if (!trimmed) {
      setError("请输入邮箱地址");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("邮箱格式不正确");
      return;
    }

    setLoadingSend(true);
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "发送失败");
        return;
      }
      setMessage("验证码已发送，请查收邮件");
      setCountdown(60);
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoadingSend(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("请输入有效邮箱");
      return;
    }
    if (!code || code.length !== 6) {
      setError("请输入 6 位验证码");
      return;
    }

    setLoadingLogin(true);
    try {
      const result = await signIn("credentials", {
        email: trimmed,
        code,
        redirect: false,
      });

      if (result?.error) {
        setError("验证码错误或已过期");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoadingLogin(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <BrandLogo size={48} showText />
          <p className="mt-3 text-sm text-slate-500">邮箱验证码登录 / 注册</p>
        </div>

        <div className="card p-8">
          <h1 className="text-center text-xl font-semibold text-slate-900">登录 / 注册</h1>
          <p className="mt-1 text-center text-sm text-slate-500">
            输入邮箱获取验证码，首次验证自动注册
          </p>

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
          )}
          {message && (
            <div className="mt-4 rounded-lg bg-sky-50 px-4 py-3 text-sm text-sky-700">{message}</div>
          )}

          <form onSubmit={handleLogin} className="mt-6 space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
                邮箱地址
              </label>
              <div className="flex gap-2">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="min-w-0 flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                />
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={loadingSend || countdown > 0}
                  className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loadingSend
                    ? "发送中..."
                    : countdown > 0
                      ? `${countdown}s`
                      : "获取验证码"}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="code" className="mb-1.5 block text-sm font-medium text-slate-700">
                6 位验证码
              </label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-center text-lg font-mono tracking-[0.3em] text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            <button
              type="submit"
              disabled={loadingLogin || code.length !== 6}
              className="btn-primary w-full py-2.5"
            >
              {loadingLogin ? "登录中..." : "登录 / 注册"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          <Link href="/" className="text-sky-600 hover:underline">
            ← 返回首页
          </Link>
        </p>
      </div>
    </div>
  );
}
