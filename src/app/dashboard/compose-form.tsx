"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ComposeForm({ defaultTo }: { defaultTo: string }) {
  const router = useRouter();
  const [to, setTo] = useState(defaultTo);
  const [subject, setSubject] = useState("MailHub 测试发信");
  const [html, setHtml] = useState(
    "<p>你好，这是一封来自 <strong>MailHub</strong> 的测试邮件。</p>"
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/dashboard/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: to.trim(), subject: subject.trim(), html }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setResult({ ok: false, text: data.error || `发送失败 (${res.status})` });
        return;
      }
      setResult({
        ok: true,
        text: data.id ? `发送成功，id: ${data.id}` : "发送成功",
      });
      router.refresh();
    } catch {
      setResult({ ok: false, text: "网络错误，请重试" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSend} className="card space-y-4 p-6">
      <div className="flex items-center gap-2">
        <span className="text-xl" aria-hidden>
          ✉️
        </span>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">实时发信</h2>
          <p className="text-sm text-slate-500">在面板内直接发送，结果会写入发件日志</p>
        </div>
      </div>

      <div>
        <label htmlFor="to" className="mb-1.5 block text-sm font-medium text-slate-700">
          收件人邮箱
        </label>
        <input
          id="to"
          type="email"
          required
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
        />
      </div>

      <div>
        <label htmlFor="subject" className="mb-1.5 block text-sm font-medium text-slate-700">
          邮件主题
        </label>
        <input
          id="subject"
          type="text"
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
        />
      </div>

      <div>
        <label htmlFor="html" className="mb-1.5 block text-sm font-medium text-slate-700">
          邮件正文（支持 HTML）
        </label>
        <textarea
          id="html"
          required
          rows={6}
          value={html}
          onChange={(e) => setHtml(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-4 py-2.5 font-mono text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-sky-500 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-sky-600 disabled:opacity-50"
      >
        {loading ? "发送中..." : "✉️ 立即发送"}
      </button>

      {result && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            result.ok
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-600"
          }`}
        >
          {result.text}
        </div>
      )}
    </form>
  );
}
