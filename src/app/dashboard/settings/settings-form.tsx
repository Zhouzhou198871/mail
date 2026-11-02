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
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationEmail, receiveEmailAlerts }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "err", text: data.error || "保存失败" });
        return;
      }
      setMessage({ type: "ok", text: "设置已保存" });
    } catch {
      setMessage({ type: "err", text: "网络错误" });
    } finally {
      setSaving(false);
    }
  }

  async function handleTestEmail() {
    setTesting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/user/test-email", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "err", text: data.error || "发送失败" });
        return;
      }
      setMessage({ type: "ok", text: `测试邮件已发送至 ${data.to}` });
    } catch {
      setMessage({ type: "err", text: "网络错误" });
    } finally {
      setTesting(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="card mt-6 max-w-xl space-y-5 p-6">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          登录邮箱
        </label>
        <input
          type="email"
          value={loginEmail}
          disabled
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-500"
        />
      </div>

      <div>
        <label
          htmlFor="notificationEmail"
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          接收交易通知的邮箱
        </label>
        <input
          id="notificationEmail"
          type="email"
          value={notificationEmail}
          onChange={(e) => setNotificationEmail(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
          required
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={receiveEmailAlerts}
          onChange={(e) => setReceiveEmailAlerts(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
        />
        接收邮件提醒
      </label>

      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            message.type === "ok"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-600"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "保存中..." : "保存设置"}
        </button>
        <button
          type="button"
          onClick={handleTestEmail}
          disabled={testing}
          className="btn-secondary"
        >
          {testing ? "发送中..." : "发送测试邮件"}
        </button>
      </div>
    </form>
  );
}
