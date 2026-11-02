"use client";

import { useState } from "react";

export function DemoApiTester() {
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState("");

  async function handleTest() {
    setLoading(true);
    setError("");
    setResult("");
    try {
      const res = await fetch("/api/v1/demo", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || data.msg || `请求失败 (${res.status})`);
        return;
      }
      setResult(JSON.stringify(data, null, 2));
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 space-y-3">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          API Key（完整密钥，仅本地使用，不会上传保存）
        </label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk_live_..."
          className="w-full rounded-lg border border-slate-200 px-4 py-2.5 font-mono text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
        />
      </div>
      <button
        type="button"
        onClick={handleTest}
        disabled={loading || !apiKey.trim()}
        className="btn-primary"
      >
        {loading ? "请求中..." : "测试接口"}
      </button>
      {error && (
        <pre className="overflow-x-auto rounded-lg bg-red-50 p-4 text-sm text-red-600">
          {error}
        </pre>
      )}
      {result && (
        <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm text-emerald-300">
          {result}
        </pre>
      )}
    </div>
  );
}
