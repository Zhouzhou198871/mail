"use client";

import { useState } from "react";

type Site = {
  id: string;
  siteName: string;
  domain: string;
  createdAt: string;
};

export function DomainsClient({
  initialSites,
  hasCf,
  hasDnshe,
}: {
  initialSites: Site[];
  hasCf: boolean;
  hasDnshe: boolean;
}) {
  const [sites, setSites] = useState(initialSites);
  const [siteName, setSiteName] = useState("");
  const [domain, setDomain] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/settings/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteName: siteName.trim(), domain: domain.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ ok: false, text: data.error || "添加失败，请检查填写内容" });
        return;
      }
      setSites((prev) => [data.site, ...prev]);
      setSiteName("");
      setDomain("");
      setMsg({ ok: true, text: "域名已添加" });
    } catch {
      setMsg({ ok: false, text: "网络连接异常，请重试" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-sm text-slate-600">
        <p className="font-semibold text-slate-900">DNS / Cloudflare 配置说明</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            Cloudflare：在 Netlify 环境变量配置{" "}
            <code className="rounded bg-white px-1">CF_API_TOKEN</code>、{" "}
            <code className="rounded bg-white px-1">CF_ACCOUNT_ID</code>
          </li>
          <li>
            DNShe / DNSPod：配置{" "}
            <code className="rounded bg-white px-1">DNSHE_API_ID</code>、{" "}
            <code className="rounded bg-white px-1">DNSHE_API_TOKEN</code>
          </li>
          <li>Token 仅存环境变量，不会写入代码仓库</li>
          <li>当前状态：CF {hasCf ? "✓" : "×"} · DNShe {hasDnshe ? "✓" : "×"}</li>
        </ul>
      </div>

      <form onSubmit={handleAdd} className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
        <h2 className="font-semibold text-slate-900">添加发件域名</h2>
        <input
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
          placeholder="网站昵称，如 官网"
          value={siteName}
          onChange={(e) => setSiteName(e.target.value)}
          required
          disabled={loading}
        />
        <input
          type="text"
          inputMode="url"
          autoCapitalize="none"
          autoCorrect="off"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
          placeholder="域名，如 mail.example.com"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          required
          disabled={loading}
        />
        <button type="submit" disabled={loading || !siteName.trim() || !domain.trim()} aria-busy={loading} className="btn-primary">
          {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
          {loading ? "正在添加..." : "添加域名"}
        </button>
        {msg && <p role="status" aria-live="polite" className={`text-sm ${msg.ok ? "text-emerald-700" : "text-red-600"}`}>{msg.text}</p>}
      </form>

      <div className="overflow-hidden rounded-2xl border border-slate-100">
        <div className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600">
          可调用域名列表（{sites.length}）
        </div>
        <ul className="divide-y divide-slate-50">
          {sites.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-slate-500">暂无域名</li>
          )}
          {sites.map((s) => (
            <li key={s.id} className="px-4 py-3 text-sm">
              <p className="font-medium text-slate-900">{s.siteName}</p>
              <p className="font-mono text-xs text-slate-600">{s.domain}</p>
              <p className="text-[11px] text-slate-400">
                {new Date(s.createdAt).toLocaleString("zh-CN")}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-600">
        <p className="font-semibold text-slate-900">网站防护建议</p>
        <p className="mt-2 leading-relaxed">
          发件 API 请使用密钥鉴权；建议在 Cloudflare 开启 Bot 防护、速率限制，并对{" "}
          <code className="rounded bg-slate-50 px-1">/api/v1/*</code>{" "}
          做基础限流，降低爬虫与滥用风险。
        </p>
      </div>
    </div>
  );
}
