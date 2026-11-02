"use client";

import { useState } from "react";

export function SettingsTester({ defaultTo }: { defaultTo: string }) {
  const [apiKey, setApiKey] = useState("");
  const [to, setTo] = useState(defaultTo);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function handleTest() {
    if (loading) return;
    if (!apiKey.trim() || !to.trim()) {
      setMessage({ type: "err", text: "请填写 API Key 和收件邮箱" });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/v1/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          to: to.trim(),
          subject: "【MailHub】API 测试邮件",
          html: "<p>这是一封来自 MailHub 的测试邮件。若你收到此信，说明 API Key 与发件通道工作正常。</p>",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setMessage({ type: "err", text: data.error || `发送失败 (${res.status})` });
        return;
      }
      setMessage({
        type: "ok",
        text: `测试邮件已发送${data.id ? `，编号：${data.id}` : ""}`,
      });
    } catch {
      setMessage({ type: "err", text: "网络连接异常，请重试" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 space-y-3">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">API Key</label>
        <input
          type="password"
          autoComplete="off"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk_live_..."
          disabled={loading}
          className="w-full rounded-lg border border-slate-200 px-4 py-2.5 font-mono text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 disabled:bg-slate-50"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">收件邮箱</label>
        <input
          type="email"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          disabled={loading}
          className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 disabled:bg-slate-50"
        />
      </div>
      <button
        type="button"
        onClick={handleTest}
        disabled={loading || !apiKey.trim() || !to.trim()}
        aria-busy={loading}
        className="btn-primary"
      >
        {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
        {loading ? "正在发送测试邮件..." : "发送测试邮件"}
      </button>
      {message && (
        <div role="status" aria-live="polite" className={`rounded-lg px-4 py-3 text-sm ${message.type === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
          {message.text}
        </div>
      )}
    </div>
  );
}
