"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
  const [providers, setProviders] = useState(initialProviders);
  const [pName, setPName] = useState("");
  const [pType, setPType] = useState("resend");
  const [pKey, setPKey] = useState("");
  const [pFrom, setPFrom] = useState("");
  const [pMsg, setPMsg] = useState("");

  async function addProvider(e: React.FormEvent) {
    e.preventDefault();
    setPMsg("");
    const res = await fetch("/api/settings/providers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: pName,
        type: pType,
        apiKey: pKey,
        fromEmail: pFrom,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setPMsg(data.error || "保存失败");
      return;
    }
    setProviders((prev) => [data.provider, ...prev]);
    setPName("");
    setPKey("");
    setPFrom("");
    setPMsg("已添加发件通道");
    router.refresh();
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
      />
      <select
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
        value={pType}
        onChange={(e) => setPType(e.target.value)}
      >
        <option value="resend">Resend</option>
        <option value="smtp">SMTP / 邮箱客户端</option>
        <option value="other">其他发件 API</option>
      </select>
      <input
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-mono"
        placeholder="API Key / 授权码"
        value={pKey}
        onChange={(e) => setPKey(e.target.value)}
        required
      />
      <input
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
        placeholder="发件人邮箱 from@domain.com"
        value={pFrom}
        onChange={(e) => setPFrom(e.target.value)}
        required
      />
      <button type="submit" className="btn-primary">
        保存发件通道
      </button>
      {pMsg && <p className="text-sm text-sky-700">{pMsg}</p>}

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
