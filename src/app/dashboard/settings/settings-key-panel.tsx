"use client";

import { useState } from "react";
import Link from "next/link";

export function SettingsKeyPanel() {
  const [loading, setLoading] = useState(false);
  const [plaintext, setPlaintext] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    setError("");
    setCopied(false);
    try {
      const res = await fetch("/api/keys", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "生成失败");
        return;
      }
      setPlaintext(data.plaintext as string);
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!plaintext) return;
    try {
      await navigator.clipboard.writeText(plaintext);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mt-4 space-y-3">
      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading}
        className="btn-primary"
      >
        {loading ? "生成中..." : "🔑 一键生成 API Key"}
      </button>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      {plaintext && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">
            请复制此密钥，用于其他网站对接
          </p>
          <p className="mt-1 text-xs text-amber-800">仅显示一次，关闭后无法再次查看完整密钥。</p>
          <code className="mt-3 block break-all rounded-lg bg-white px-3 py-2 font-mono text-sm text-slate-900">
            {plaintext}
          </code>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={handleCopy} className="btn-secondary">
              {copied ? "已复制" : "复制密钥"}
            </button>
            <Link href="/dashboard/keys" className="btn-secondary">
              前往密钥列表
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
