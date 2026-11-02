"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});

  function validate() {
    const next: typeof errors = {};
    const trimmed = email.trim();

    if (!trimmed) {
      next.email = "请输入邮箱";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      next.email = "邮箱格式不正确";
    }

    if (!password) {
      next.password = "请输入密码";
    } else if (password.length < 6) {
      next.password = "密码至少 6 位";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    try {
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setErrors({ form: "邮箱或密码错误" });
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setErrors({ form: "网络错误，请重试" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="https://raw.githubusercontent.com/Zhouzhou198871/pay/main/logo.png"
              alt="晴天支付"
              width={48}
              height={48}
              className="h-12 w-12 rounded-xl object-contain shadow-sm"
              priority
              unoptimized
            />
            <span className="text-2xl font-bold text-slate-800">晴天支付</span>
          </Link>
          <p className="mt-3 text-sm text-slate-500">登录商户开发者平台</p>
        </div>

        <div className="card p-8">
          <h1 className="text-center text-xl font-semibold text-slate-900">登录</h1>
          <p className="mt-1 text-center text-sm text-slate-500">使用邮箱和密码登录</p>

          {errors.form && (
            <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {errors.form}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
                邮箱地址
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
              />
              {errors.email && (
                <p className="mt-1.5 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
                密码
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                placeholder="至少 6 位"
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
              />
              {errors.password && (
                <p className="mt-1.5 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5"
            >
              {loading ? "登录中..." : "登录"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            还没有账号？{" "}
            <Link href="/register" className="font-medium text-sky-600 hover:underline">
              去注册
            </Link>
          </p>
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
