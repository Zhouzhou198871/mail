"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MAIL_TEMPLATES } from "@/lib/templates";

export function TemplateSendForm({ defaultTo }: { defaultTo: string }) {
  const router = useRouter();
  const [to, setTo] = useState(defaultTo);
  const [templateId, setTemplateId] = useState(MAIL_TEMPLATES[9]?.id || "test");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const selected = MAIL_TEMPLATES.find((t) => t.id === templateId);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/dashboard/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: to.trim(), templateId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setResult({ ok: false, text: data.error || "发送失败" });
        return;
      }
      setResult({ ok: true, text: data.id ? `发送成功 · ${data.id}` : "发送成功" });
      router.refresh();
    } catch {
      setResult({ ok: false, text: "网络错误" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSend}
      className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/90 p-4"
    >
      <div>
        <h2 className="text-base font-semibold text-slate-900">一键发信</h2>
        <p className="text-xs text-slate-500">选模版即可发送，无需编写 HTML</p>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">收件人邮箱</label>
        <input
          type="email"
          required
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
        />
      </div>

      <div>
        <label className="mb-2 block text-xs font-medium text-slate-600">选择模版</label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {MAIL_TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTemplateId(t.id)}
              className={`rounded-xl border px-2 py-2.5 text-left text-xs font-medium transition active:scale-[0.97] ${
                templateId === t.id
                  ? "border-sky-400 bg-sky-50 text-sky-800 shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:border-sky-200"
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {selected && (
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
          <p className="text-xs text-slate-500">预览</p>
          <p className="mt-1 font-medium text-slate-900">{selected.subject}</p>
          <p className="mt-2 whitespace-pre-line text-slate-600">{selected.body}</p>
        </div>
      )}

      <button type="submit" disabled={loading} className="btn-primary w-full py-3">
        {loading ? "发送中..." : "一键发送"}
      </button>

      {result && (
        <div
          className={`rounded-xl px-3 py-2.5 text-sm ${
            result.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
          }`}
        >
          {result.text}
        </div>
      )}
    </form>
  );
}
