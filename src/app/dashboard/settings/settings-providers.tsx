"use client";

import { useState } from "react";

type Provider = {
  id: string;
  name: string;
  type: string;
  fromEmail: string;
  note: string | null;
  createdAt: string;
};

export function SettingsProviders({
  providers: initialProviders,
}: {
  providers: Provider[];
}) {
  const [providers, setProviders] = useState(initialProviders);
  const [pName, setPName] = useState("");
  const [pType, setPType] = useState("resend");
  const [pKey, setPKey] = useState("");
  const [pFrom, setPFrom] = useState("");
  const [pMsg, setPMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  async function addProvider(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setPMsg(null);
    try {
      const res = await fetch("/api/settings/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: pName.trim(),
          type: pType,
          apiKey: pKey.trim(),
          fromEmail: pFrom.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPMsg({ ok: false, text: data.error || "保存失败，请检查配置" });
        return;
      }
      setProviders((prev) => [data.provider, ...prev]);
      setPName("");
      setPKey("");
      setPFrom("");
      setPMsg({ ok: true, text: "发件通道已添加" });
    } catch {
      setPMsg({ ok: false, text: "网络连接异常，请重试" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={addProvider} className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
      <h2 className="font-semibold text-slate-900">上传发件 API</h2>
      <p className="text-xs text-slate-500">支持 Resend / SMTP 等通道，可添加多个备用</p>
      <input
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
        placeholder="通道名称，如 Resend 主号"
        value={pName}
        onChange={(e) => setPName(e.target.value)}
        required
        disabled={saving}
      />
      <select
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
        value={pType}
        onChange={(e) => setPType(e.target.value)}
        disabled={saving}
      >
        <option value="resend">Resend</option>
        <option value="smtp">SMTP / 邮箱客户端</option>
        <option value="other">其他发件 API</option>
      </select>
      <input
        type="password"
        autoComplete="new-password"
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-mono"
        placeholder="API Key / 授权码"
        value={pKey}
        onChange={(e) => setPKey(e.target.value)}
        required
        disabled={saving}
      />
      <input
        type="email"
        autoCapitalize="none"
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
        placeholder="发件人邮箱 from@domain.com"
        value={pFrom}
        onChange={(e) => setPFrom(e.target.value)}
        required
        disabled={saving}
      />
      <button type="submit" disabled={saving || !pName.trim() || !pKey.trim() || !pFrom.trim()} aria-busy={saving} className="btn-primary">
        {saving && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
        {saving ? "正在保存..." : "保存发件通道"}
      </button>
      {pMsg && <p role="status" aria-live="polite" className={`text-sm ${pMsg.ok ? "text-emerald-700" : "text-red-600"}`}>{pMsg.text}</p>}

      <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100 bg-white">
        {providers.map((p) => (
          <li key={p.id} className="px-3 py-2 text-sm">
            <p className="font-medium">{p.name}</p>
            <p className="text-xs text-slate-500">
              {p.type} · {p.fromEmail}
            </p>
          </li>
        ))}
        {providers.length === 0 && (
          <li className="px-3 py-4 text-center text-xs text-slate-400">暂无额外通道</li>
        )}
      </ul>
    </form>
  );
}
