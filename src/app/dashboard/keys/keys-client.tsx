"use client";

import { useState } from "react";

type KeyItem = {
  id: string;
  keyPrefix: string;
  lastFour: string;
  status: string;
  createdAt: string;
  lastUsedAt: string | null;
};

export function KeysClient({ initialKeys }: { initialKeys: KeyItem[] }) {
  const [keys, setKeys] = useState(initialKeys);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [plaintext, setPlaintext] = useState<string | null>(null);

  async function handleCreate() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/keys", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "生成失败");
        return;
      }
      setPlaintext(data.plaintext as string);
      setKeys((prev) => [data.key as KeyItem, ...prev]);
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  }

  async function handleRevoke(id: string) {
    if (!confirm("确定吊销该密钥？吊销后不可恢复。")) return;
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

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={handleCreate}
        disabled={loading}
        className="btn-primary"
      >
        {loading ? "生成中..." : "生成新密钥"}
      </button>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {plaintext && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-semibold text-amber-900">
            请立即保存密钥（仅显示一次）
          </p>
          <p className="mt-1 text-sm text-amber-800">
            关闭后将无法再次查看完整密钥。
          </p>
          <code className="mt-3 block break-all rounded-lg bg-white px-3 py-2 font-mono text-sm text-slate-900">
            {plaintext}
          </code>
          <button
            type="button"
            className="btn-secondary mt-3"
            onClick={() => {
              navigator.clipboard?.writeText(plaintext);
            }}
          >
            复制密钥
          </button>
          <button
            type="button"
            className="ml-2 text-sm text-slate-500 hover:text-slate-800"
            onClick={() => setPlaintext(null)}
          >
            我已保存，关闭
          </button>
        </div>
      )}

      <div className="card mt-6 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">密钥</th>
              <th className="px-4 py-3 font-medium">状态</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">创建时间</th>
              <th className="px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {keys.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  暂无 API 密钥，点击上方按钮生成
                </td>
              </tr>
            )}
            {keys.map((k) => (
              <tr key={k.id} className="border-b border-slate-50 last:border-0">
                <td className="px-4 py-3 font-mono text-slate-800">
                  {k.keyPrefix}...{k.lastFour}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      k.status === "active"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {k.status === "active" ? "生效中" : "已吊销"}
                  </span>
                </td>
                <td className="hidden px-4 py-3 text-slate-500 sm:table-cell">
                  {new Date(k.createdAt).toLocaleString("zh-CN")}
                </td>
                <td className="px-4 py-3">
                  {k.status === "active" && (
                    <button
                      type="button"
                      onClick={() => handleRevoke(k.id)}
                      className="text-sm text-rose-600 hover:underline"
                    >
                      吊销
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
