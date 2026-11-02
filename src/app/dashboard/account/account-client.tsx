"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

type AdminItem = { id: string; email: string; createdAt: string };

export function AccountClient({
  currentEmail,
  admins: initialAdmins,
}: {
  currentEmail: string;
  admins: AdminItem[];
}) {
  const router = useRouter();
  const [admins, setAdmins] = useState(initialAdmins);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwdMsg, setPwdMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pwdLoading, setPwdLoading] = useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [adminMsg, setAdminMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
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
        setPwdMsg({ ok: false, text: data.error || "修改失败" });
        return;
      }
      setPwdMsg({ ok: true, text: "密码已更新，请牢记新密码" });
      setOldPassword("");
      setNewPassword("");
    } catch {
      setPwdMsg({ ok: false, text: "网络错误" });
    } finally {
      setPwdLoading(false);
    }
  }

  async function handleAddAdmin(e: React.FormEvent) {
    e.preventDefault();
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
      router.refresh();
    } catch {
      setAdminMsg({ ok: false, text: "网络错误" });
    } finally {
      setAdminLoading(false);
    }
  }

  async function handleDeleteAdmin(id: string, email: string) {
    if (email === currentEmail) {
      alert("不能删除当前登录账号");
      return;
    }
    if (!confirm(`确定删除管理员 ${email}？`)) return;
    try {
      const res = await fetch(`/api/admin/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "删除失败");
        return;
      }
      setAdmins((prev) => prev.filter((a) => a.id !== id));
    } catch {
      alert("网络错误");
    }
  }

  return (
    <div className="space-y-5">
      {/* Change password */}
      <form
        onSubmit={handleChangePassword}
        className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 space-y-3"
      >
        <h2 className="font-semibold text-slate-900">修改密码</h2>
        <input
          type="password"
          placeholder="当前密码"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
          required
        />
        <input
          type="password"
          placeholder="新密码（至少 6 位）"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
          required
          minLength={6}
        />
        <button type="submit" disabled={pwdLoading} className="btn-primary">
          {pwdLoading ? "提交中..." : "保存新密码"}
        </button>
        {pwdMsg && (
          <p className={`text-sm ${pwdMsg.ok ? "text-emerald-600" : "text-red-600"}`}>
            {pwdMsg.text}
          </p>
        )}
      </form>

      {/* Add admin */}
      <form
        onSubmit={handleAddAdmin}
        className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 space-y-3"
      >
        <h2 className="font-semibold text-slate-900">添加管理员</h2>
        <input
          type="email"
          placeholder="新管理员邮箱"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
          required
        />
        <input
          type="password"
          placeholder="初始密码（至少 6 位）"
          value={newAdminPassword}
          onChange={(e) => setNewAdminPassword(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
          required
          minLength={6}
        />
        <button type="submit" disabled={adminLoading} className="btn-primary">
          {adminLoading ? "添加中..." : "添加管理员"}
        </button>
        {adminMsg && (
          <p className={`text-sm ${adminMsg.ok ? "text-emerald-600" : "text-red-600"}`}>
            {adminMsg.text}
          </p>
        )}
      </form>

      {/* Admin list */}
      <div className="rounded-2xl border border-slate-100 overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600">
          管理员列表
        </div>
        <ul className="divide-y divide-slate-50">
          {admins.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
            >
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
                  className="shrink-0 rounded-lg px-2 py-1 text-rose-600 transition hover:bg-rose-50 active:scale-[0.97]"
                >
                  删除
                </button>
              ) : (
                <span className="shrink-0 rounded-full bg-sky-50 px-2 py-0.5 text-xs text-sky-700">
                  当前
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="w-full rounded-xl border border-rose-200 bg-rose-50 py-3 text-sm font-semibold text-rose-600 shadow-sm transition hover:bg-rose-100 active:scale-[0.98]"
      >
        退出登录
      </button>
    </div>
  );
}
