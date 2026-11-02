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
    if (loading) return;
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
        text: data.id ? `发送成功，编号：${data.id}` : "发送成功",
      });
      router.refresh();
    } catch {
      setResult({ ok: false, text: "网络连接异常，请重试" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSend}
      className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/90 p-4 sm:p-5"
    >
      <div>
        <h2 className="text-base font-semibold text-slate-900">实时发信</h2>
        <p className="text-xs text-slate-500">发送结果会写入发件日志</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="to" className="mb-1 block text-xs font-medium text-slate-600">收件人邮箱</label>
          <input
            id="to"
            type="email"
            required
            value={to}
            onChange={(e) => setTo(e.target.value)}
            disabled={loading}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 disabled:bg-slate-50"
          />
        </div>
        <div>
          <label htmlFor="subject" className="mb-1 block text-xs font-medium text-slate-600">邮件主题</label>
          <input
            id="subject"
            type="text"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={loading}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 disabled:bg-slate-50"
          />
        </div>
      </div>

      <div>
        <label htmlFor="html" className="mb-1 block text-xs font-medium text-slate-600">邮件正文（HTML）</label>
        <textarea
          id="html"
          required
          rows={5}
          value={html}
          onChange={(e) => setHtml(e.target.value)}
          disabled={loading}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-mono text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 disabled:bg-slate-50"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !to.trim() || !subject.trim() || !html.trim()}
        aria-busy={loading}
        className="btn-primary w-full py-3"
      >
        {loading ? (
          <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />邮件发送中...</>
        ) : "立即发送"}
      </button>

      {result && (
        <div
          role="status"
          aria-live="polite"
          className={`rounded-xl px-3 py-2.5 text-sm transition ${result.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}
        >
          {result.text}
        </div>
      )}
    </form>
  );
}
