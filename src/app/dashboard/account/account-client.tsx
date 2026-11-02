"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

type AdminItem = { id: string; email: string; createdAt: string };

export function AccountClient({
  currentEmail,
  admins: initialAdmins,
}: {
  currentEmail: string;
  admins: AdminItem[];
}) {
  const [admins, setAdmins] = useState(initialAdmins);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwdMsg, setPwdMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pwdLoading, setPwdLoading] = useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [adminMsg, setAdminMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [listMsg, setListMsg] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pwdLoading) return;
    setPwdLoading(true);
    setPwdMsg(null);
    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPwdMsg({ ok: false, text: data.error || "修改失败，请检查当前密码" });
        return;
      }
      setPwdMsg({ ok: true, text: "密码已更新，请牢记新密码" });
      setOldPassword("");
      setNewPassword("");
    } catch {
      setPwdMsg({ ok: false, text: "网络连接异常，请重试" });
    } finally {
      setPwdLoading(false);
    }
  }

  async function handleAddAdmin(e: React.FormEvent) {
    e.preventDefault();
    if (adminLoading) return;
    setAdminLoading(true);
    setAdminMsg(null);
    try {
      const res = await fetch("/api/admin/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newEmail.trim().toLowerCase(),
          password: newAdminPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAdminMsg({ ok: false, text: data.error || "添加失败" });
        return;
      }
      setAdmins((prev) => [...prev, data.admin as AdminItem]);
      setAdminMsg({ ok: true, text: "管理员已添加" });
      setNewEmail("");
      setNewAdminPassword("");
    } catch {
      setAdminMsg({ ok: false, text: "网络连接异常，请重试" });
    } finally {
      setAdminLoading(false);
    }
  }

  async function handleDeleteAdmin(id: string, email: string) {
    if (email === currentEmail || deletingId) return;
    if (!confirm(`确定删除管理员 ${email}？`)) return;
    setDeletingId(id);
    setListMsg("");
    try {
      const res = await fetch(`/api/admin/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setListMsg(data.error || "删除失败");
        return;
      }
      setAdmins((prev) => prev.filter((a) => a.id !== id));
      setListMsg(`管理员 ${email} 已删除`);
    } catch {
      setListMsg("网络连接异常，请重试");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut({ callbackUrl: "/login" });
    } catch {
      setSigningOut(false);
      setListMsg("退出失败，请重试");
    }
  }

  return (
    <div className="space-y-5">
      <form
        onSubmit={handleChangePassword}
        className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4"
      >
        <h2 className="font-semibold text-slate-900">修改密码</h2>
        <input
          type="password"
          autoComplete="current-password"
          placeholder="当前密码"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          disabled={pwdLoading}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 disabled:bg-slate-50"
          required
        />
        <input
          type="password"
          autoComplete="new-password"
          placeholder="新密码（至少 6 位）"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          disabled={pwdLoading}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 disabled:bg-slate-50"
          required
          minLength={6}
        />
        <button type="submit" disabled={pwdLoading || !oldPassword || newPassword.length < 6} aria-busy={pwdLoading} className="btn-primary">
          {pwdLoading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
          {pwdLoading ? "正在保存..." : "保存新密码"}
        </button>
        {pwdMsg && <p role="status" aria-live="polite" className={`text-sm ${pwdMsg.ok ? "text-emerald-600" : "text-red-600"}`}>{pwdMsg.text}</p>}
      </form>

      <form
        onSubmit={handleAddAdmin}
        className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4"
      >
        <h2 className="font-semibold text-slate-900">添加管理员</h2>
        <input
          type="email"
          autoCapitalize="none"
          placeholder="新管理员邮箱"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          disabled={adminLoading}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 disabled:bg-slate-50"
          required
        />
        <input
          type="password"
          autoComplete="new-password"
          placeholder="初始密码（至少 6 位）"
          value={newAdminPassword}
          onChange={(e) => setNewAdminPassword(e.target.value)}
          disabled={adminLoading}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 disabled:bg-slate-50"
          required
          minLength={6}
        />
        <button type="submit" disabled={adminLoading || !newEmail.trim() || newAdminPassword.length < 6} aria-busy={adminLoading} className="btn-primary">
          {adminLoading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
          {adminLoading ? "正在添加..." : "添加管理员"}
        </button>
        {adminMsg && <p role="status" aria-live="polite" className={`text-sm ${adminMsg.ok ? "text-emerald-600" : "text-red-600"}`}>{adminMsg.text}</p>}
      </form>

      <div className="overflow-hidden rounded-2xl border border-slate-100">
        <div className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600">
          管理员列表
        </div>
        <ul className="divide-y divide-slate-50">
          {admins.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">{a.email}</p>
                <p className="text-[11px] text-slate-400">
                  {new Date(a.createdAt).toLocaleString("zh-CN")}
                </p>
              </div>
              {a.email !== currentEmail ? (
                <button
                  type="button"
                  onClick={() => handleDeleteAdmin(a.id, a.email)}
                  disabled={deletingId !== null}
                  aria-busy={deletingId === a.id}
                  className="shrink-0 rounded-lg px-2 py-1 text-rose-600 transition hover:bg-rose-50 active:scale-[0.97] disabled:opacity-50"
                >
                  {deletingId === a.id ? "删除中..." : "删除"}
                </button>
              ) : (
                <span className="shrink-0 rounded-full bg-sky-50 px-2 py-0.5 text-xs text-sky-700">当前</span>
              )}
            </li>
          ))}
          {admins.length === 0 && <li className="px-4 py-6 text-center text-sm text-slate-500">暂无管理员</li>}
        </ul>
      </div>
      {listMsg && <p role="status" aria-live="polite" className="text-sm text-slate-600">{listMsg}</p>}

      <button
        type="button"
        onClick={handleSignOut}
        disabled={signingOut}
        aria-busy={signingOut}
        className="w-full rounded-xl border border-rose-200 bg-rose-50 py-3 text-sm font-semibold text-rose-600 shadow-sm transition hover:bg-rose-100 active:scale-[0.98] disabled:opacity-60"
      >
        {signingOut ? "正在退出..." : "退出登录"}
      </button>
    </div>
  );
}
