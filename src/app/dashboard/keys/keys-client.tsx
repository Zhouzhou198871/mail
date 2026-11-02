"use client";

import { useState } from "react";

type KeyItem = {
  id: string;
  name: string;
  keyPrefix: string;
  lastFour: string;
  status: string;
  createdAt: string;
  lastUsedAt: string | null;
};

export function KeysClient({ initialKeys }: { initialKeys: KeyItem[] }) {
  const [keys, setKeys] = useState(initialKeys);
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [plaintext, setPlaintext] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleCreate() {
    const name = nickname.trim();
    if (!name) {
      setError("请先填写密钥昵称，例如：官网通知 / 商城验证码");
      return;
    }
    setLoading(true);
    setError("");
    setCopied(false);
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "生成失败");
        return;
      }
      setPlaintext(data.plaintext as string);
      setKeys((prev) => [data.key as KeyItem, ...prev]);
      setNickname("");
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  }

  async function handleRevoke(id: string, name: string) {
    if (!confirm(`确定吊销「${name}」？吊销后不可恢复。`)) return;
    setError("");
    try {
      const res = await fetch(`/api/keys/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "吊销失败");
        return;
      }
      setKeys((prev) =>
        prev.map((k) => (k.id === id ? { ...k, status: "revoked" } : k))
      );
    } catch {
      setError("网络错误");
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
    <div className="mt-5 space-y-4">
      {/* Usage guide */}
      <div className="rounded-2xl border border-sky-100 bg-sky-50/80 p-4 text-sm text-slate-700">
        <p className="font-semibold text-sky-900">怎么调用？一句话说明</p>
        <p className="mt-1.5 leading-relaxed text-slate-600">
          其他网站发 POST 请求到{" "}
          <code className="rounded bg-white px-1 font-mono text-xs">/api/v1/send</code>
          ，请求头带上{" "}
          <code className="rounded bg-white px-1 font-mono text-xs">Authorization: Bearer 你的密钥</code>
          ，正文传{" "}
          <code className="rounded bg-white px-1 font-mono text-xs">to / subject / html</code>
          即可发信。
        </p>
        <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-900 p-3 text-[11px] leading-5 text-slate-100">
{`curl -X POST /api/v1/send \\
  -H "Authorization: Bearer sk_live_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{"to":"a@b.com","subject":"你好","html":"<p>内容</p>"}'`}
        </pre>
      </div>

      {/* Create */}
      <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
        <label className="mb-1.5 block text-xs font-medium text-slate-600">
          密钥昵称（必填，方便以后识别删除）
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="例如：官网验证码、商城通知"
            maxLength={40}
            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={loading}
            className="btn-primary shrink-0"
          >
            {loading ? "生成中..." : "生成新密钥"}
          </button>
        </div>
        {error && (
          <div className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
        )}
      </div>

      {plaintext && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">请立即保存密钥（仅显示一次）</p>
          <p className="mt-1 text-xs text-amber-800">关闭后无法再次查看完整密钥，请复制到对接网站配置里。</p>
          <code className="mt-3 block break-all rounded-xl bg-white px-3 py-2 font-mono text-sm text-slate-900">
            {plaintext}
          </code>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={handleCopy} className="btn-secondary">
              {copied ? "已复制 ✓" : "复制密钥"}
            </button>
            <button
              type="button"
              className="rounded-xl px-3 py-2 text-sm text-slate-500 transition hover:text-slate-800 active:scale-[0.98]"
              onClick={() => setPlaintext(null)}
            >
              我已保存，关闭
            </button>
          </div>
        </div>
      )}

      {/* Scrollable list */}
      <div className="max-h-[28rem] overflow-y-auto overscroll-contain rounded-2xl border border-slate-100">
        <ul className="divide-y divide-slate-50">
          {keys.length === 0 && (
            <li className="px-4 py-10 text-center text-sm text-slate-500">
              暂无密钥，填写昵称后点击生成
            </li>
          )}
          {keys.map((k) => (
            <li
              key={k.id}
              className="flex flex-col gap-2 px-4 py-3 transition hover:bg-slate-50/80 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">{k.name}</p>
                <p className="mt-0.5 font-mono text-xs text-slate-500">
                  {k.keyPrefix}...{k.lastFour}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  创建于 {new Date(k.createdAt).toLocaleString("zh-CN")}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    k.status === "active"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {k.status === "active" ? "生效中" : "已吊销"}
                </span>
                {k.status === "active" && (
                  <button
                    type="button"
                    onClick={() => handleRevoke(k.id, k.name)}
                    className="rounded-lg px-2 py-1 text-sm text-rose-600 transition hover:bg-rose-50 active:scale-[0.97]"
                  >
                    吊销
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
