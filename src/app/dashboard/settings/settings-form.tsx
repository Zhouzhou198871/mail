"use client";

import { useState } from "react";

export function SettingsForm({
  loginEmail,
  notificationEmail: initialEmail,
  receiveEmailAlerts: initialAlerts,
}: {
  loginEmail: string;
  notificationEmail: string;
  receiveEmailAlerts: boolean;
}) {
  const [notificationEmail, setNotificationEmail] = useState(initialEmail);
  const [receiveEmailAlerts, setReceiveEmailAlerts] = useState(initialAlerts);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationEmail: notificationEmail.trim(), receiveEmailAlerts }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "err", text: data.error || "保存失败，请重试" });
        return;
      }
      setMessage({ type: "ok", text: "设置已保存" });
    } catch {
      setMessage({ type: "err", text: "网络连接异常，请重试" });
    } finally {
      setSaving(false);
    }
  }

  async function handleTestEmail() {
    if (testing) return;
    setTesting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/user/test-email", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "err", text: data.error || "提交失败，请重试" });
        return;
      }
      setMessage({ type: "ok", text: `测试邮件已进入发送队列，收件人：${data.to}` });
    } catch {
      setMessage({ type: "err", text: "网络连接异常，请重试" });
    } finally {
      setTesting(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="card mt-6 max-w-xl space-y-5 p-6">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">登录邮箱</label>
        <input
          type="email"
          value={loginEmail}
          disabled
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-500"
        />
      </div>

      <div>
        <label htmlFor="notificationEmail" className="mb-1.5 block text-sm font-medium text-slate-700">
          接收交易通知的邮箱
        </label>
        <input
          id="notificationEmail"
          type="email"
          value={notificationEmail}
          onChange={(e) => setNotificationEmail(e.target.value)}
          disabled={saving || testing}
          className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 disabled:bg-slate-50"
          required
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={receiveEmailAlerts}
          onChange={(e) => setReceiveEmailAlerts(e.target.checked)}
          disabled={saving || testing}
          className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
        />
        接收邮件提醒
      </label>

      {message && (
        <div role="status" aria-live="polite" className={`rounded-lg px-4 py-3 text-sm ${message.type === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
          {message.text}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={saving || testing} aria-busy={saving} className="btn-primary">
          {saving && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
          {saving ? "正在保存..." : "保存设置"}
        </button>
        <button
          type="button"
          onClick={handleTestEmail}
          disabled={testing || saving}
          aria-busy={testing}
          className="btn-secondary"
        >
          {testing && <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400/40 border-t-slate-600" />}
          {testing ? "正在发送..." : "发送测试邮件"}
        </button>
      </div>
    </form>
  );
}
