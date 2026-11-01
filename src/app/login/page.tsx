"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "发送失败");
        return;
      }
      setMessage("验证码已发送，请查收邮件");
      setStep("code");
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "验证失败");
        return;
      }
      router.push("/dashboard");
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-sky-50 to-white px-4">
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
          <p className="mt-3 text-sm text-slate-500">使用邮箱验证码登录开发者平台</p>
        </div>

        <div className="card p-8">
          <h1 className="text-xl font-semibold text-slate-900 text-center">
            {step === "email" ? "登录 / 注册" : "输入验证码"}
          </h1>
          <p className="mt-1 text-center text-sm text-slate-500">
            {step === "email"
              ? "输入邮箱，我们将发送 6 位验证码"
              : `验证码已发送至 ${email}`}
          </p>

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}
          {message && (
            <div className="mt-4 rounded-lg bg-sky-50 px-4 py-3 text-sm text-sky-700">
              {message}
            </div>
          )}

          {step === "email" ? (
            <form onSubmit={handleSendOTP} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  邮箱地址
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-2.5"
              >
                {loading ? "发送中..." : "发送验证码"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  6 位验证码
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-center text-lg tracking-[0.3em] font-mono outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                />
              </div>
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="btn-primary w-full py-2.5"
              >
                {loading ? "验证中..." : "登录"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setCode("");
                  setError("");
                  setMessage("");
                }}
                className="w-full text-sm text-slate-500 hover:text-sky-600"
              >
                更换邮箱
              </button>
            </form>
          )}
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
