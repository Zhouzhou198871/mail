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
  const [githubLoading, setGithubLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGitHubLogin() {
    if (loading || githubLoading) return;
    setError("");
    setGithubLoading(true);
    try {
      await signIn("github", { callbackUrl: "/dashboard" });
    } catch {
      setGithubLoading(false);
      setError("GitHub 授权启动失败，请稍后重试");
    }
  }

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading || githubLoading) return;
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center">
          <BrandLogo size={48} showText href="/login" />
          <p className="mt-3 text-sm text-slate-500">管理员登录</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-center text-xl font-semibold text-slate-900">登录</h1>
          <p className="mt-1 text-center text-sm text-slate-500">使用已授权的管理员账号登录 MailHub</p>

          {error && (
            <div role="alert" aria-live="polite" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleGitHubLogin}
            disabled={loading || githubLoading}
            aria-busy={githubLoading}
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl bg-slate-950 px-5 py-4 text-base font-semibold text-white shadow-lg shadow-slate-900/15 transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-400/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {githubLoading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-current">
                <path d="M12 .9a11.1 11.1 0 0 0-3.51 21.63c.55.1.76-.24.76-.53v-2.08c-3.1.68-3.76-1.32-3.76-1.32-.5-1.29-1.24-1.63-1.24-1.63-1.01-.69.08-.68.08-.68 1.12.08 1.71 1.15 1.71 1.15 1 .1.77 2.2 3.48 1.66.1-.72.4-1.21.7-1.49-2.48-.28-5.09-1.24-5.09-5.53 0-1.22.44-2.22 1.15-3-.12-.28-.5-1.42.11-2.96 0 0 .94-.3 3.05 1.14a10.6 10.6 0 0 1 5.55 0c2.11-1.44 3.05-1.14 3.05-1.14.61 1.54.23 2.68.11 2.96.72.78 1.15 1.78 1.15 3 0 4.3-2.61 5.25-5.1 5.52.4.35.75 1.03.75 2.08V22c0 .29.2.63.76.52A11.1 11.1 0 0 0 12 .9Z" />
              </svg>
            )}
            {githubLoading ? "正在跳转 GitHub..." : "使用 GitHub 账号一键登录"}
          </button>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs text-slate-400">或使用邮箱密码登录</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <form onSubmit={handleLogin} className="space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">邮箱 / 账号</label>
              <input id="email" name="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" disabled={loading || githubLoading} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 disabled:bg-slate-50" />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">密码</label>
              <input id="password" name="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="请输入密码" disabled={loading || githubLoading} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 disabled:bg-slate-50" />
            </div>
            <button type="submit" disabled={loading || githubLoading} aria-busy={loading} className="btn-primary w-full py-3">
              {loading ? (<> <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> 正在验证...</>) : ("登录")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
