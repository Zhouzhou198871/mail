"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { BrandLogo } from "@/components/brand-logo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    setError("");
    const formData = new FormData(e.currentTarget);
    const submittedEmail = String(formData.get("email") || email).trim().toLowerCase();
    const submittedPassword = String(formData.get("password") || password);

    if (!submittedEmail || !submittedPassword) {
      setError("请输入账号和密码");
      return;
    }

    setEmail(submittedEmail);
    setPassword(submittedPassword);
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: submittedEmail,
        password: submittedPassword,
        redirect: false,
      });
      if (result?.error) {
        setError("账号或密码错误");
        return;
      }
      router.replace("/dashboard");
    } catch {
      setError("网络连接异常，请检查网络后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center">
          <BrandLogo size={48} showText href="/login" />
          <p className="mt-3 text-sm text-slate-500">管理员登录</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-center text-xl font-semibold text-slate-900">登录</h1>
          <p className="mt-1 text-center text-sm text-slate-500">请输入管理员账号与密码</p>
          {error && (
            <div role="alert" aria-live="polite" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}
          <form onSubmit={handleLogin} className="mt-6 space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">邮箱 / 账号</label>
              <input id="email" name="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" disabled={loading} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 disabled:bg-slate-50" />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">密码</label>
              <input id="password" name="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="请输入密码" disabled={loading} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 disabled:bg-slate-50" />
            </div>
            <button type="submit" disabled={loading} aria-busy={loading} className="btn-primary w-full py-3">
              {loading ? (<> <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> 正在验证...</>) : ("登录")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
