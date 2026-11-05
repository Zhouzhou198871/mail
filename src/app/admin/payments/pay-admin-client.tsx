"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Merchant = {
  id: string; merchant_no: string | null; site_name: string; site_url: string;
  status: string; api_access_granted: number; created_at: number; balance_micro: number;
};
type Order = {
  id: string; trade_no: string; out_trade_no: string; amount_cents: number;
  amount_micro: number | null; currency: string; method: string; subject: string;
  status: string; created_at: number; paid_at: number | null; provider_trade_no: string | null;
  merchant_no: string | null; site_name: string | null;
};
type Withdrawal = {
  id: string; request_no: string; user_id: string; amount_micro: number; fee_micro: number;
  currency: string; destination_masked: string | null; status: string; requested_at: number;
  reviewed_at: number | null; payout_reference: string | null; withdraw_type: string;
  bank_account_info: string; payout_amount_micro: number; payout_amount_cents: number; fee_amount: number;
  admin_note: string; user_email: string | null; merchant_no: string | null; site_name: string | null;
};
type AccessRequest = {
  id: string; ticket_id: string; user_id: string; merchant_id: string; app_type: string;
  app_name: string; website_url: string; status: string; reviewed_at: number | null;
  review_note: string; created_at: number; ticket_subject: string | null;
  ticket_status: string | null; merchant_no: string | null; site_name: string | null;
  user_email: string | null;
};
type Message = { id: string; ticket_id: string; sender_role: string; message_type: string; content: string; created_at: number };
type Data = { merchants: Merchant[]; orders: Order[]; withdrawals: Withdrawal[]; requests: AccessRequest[]; messages: Message[] };
type Tab = "merchants" | "orders" | "withdrawals" | "requests";

const tabs: { id: Tab; label: string }[] = [
  { id: "merchants", label: "商户管理" },
  { id: "orders", label: "全站订单" },
  { id: "withdrawals", label: "提现审核" },
  { id: "requests", label: "工单审批" },
];
const money = (value: number, digits = 2) => (Number(value || 0) / 100).toLocaleString("zh-CN", { minimumFractionDigits: digits, maximumFractionDigits: digits });
const usdt = (value: number) => (Number(value || 0) / 1_000_000).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 6 });
const date = (value?: number | null) => value ? new Date(value * 1000).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", hour12: false }) : "—";
const statusLabel: Record<string, string> = {
  pending: "待处理", active: "正常", suspended: "已冻结", rejected: "已拒绝", revoked: "已撤销",
  paid: "已支付", expired: "已过期", cancelled: "已取消", refunded: "已退款",
  approved: "已通过", processing: "处理中", failed: "失败", open: "待处理", closed: "已关闭",
};
const badgeClass = (status: string) => status === "paid" || status === "active" || status === "approved"
  ? "bg-emerald-50 text-emerald-700"
  : status === "suspended" || status === "rejected" || status === "failed"
    ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700";

function bankInfo(raw: string) {
  try { return JSON.parse(raw || "{}") as Record<string, unknown>; }
  catch { return { detail: raw }; }
}
function imageValue(info: Record<string, unknown>) {
  const value = info.qr_code || info.qrCode || info.qr_image || info.qrImage || info.image_url || info.imageUrl || info.image;
  return typeof value === "string" && (/^https:\/\//i.test(value) || /^data:image\//i.test(value)) ? value : "";
}

export function PayAdminClient() {
  const [tab, setTab] = useState<Tab>("merchants");
  const [data, setData] = useState<Data>({ merchants: [], orders: [], withdrawals: [], requests: [], messages: [] });
  const [orderStatus, setOrderStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [hashes, setHashes] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/payments?orderStatus=${encodeURIComponent(orderStatus)}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "读取支付数据失败");
      setData(payload as Data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "读取数据失败，请稍后重试");
    } finally { setLoading(false); }
  }, [orderStatus]);

  useEffect(() => { void load(); }, [load]);

  async function act(key: string, body: Record<string, string>) {
    if (busy) return;
    setBusy(key); setMessage("");
    try {
      const response = await fetch("/api/admin/payments", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "操作失败");
      setMessage("操作已完成");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "操作失败，请稍后重试");
    } finally { setBusy(null); }
  }

  const pendingWithdrawals = useMemo(() => data.withdrawals.filter(x => ["pending", "approved", "processing"].includes(x.status)), [data.withdrawals]);
  const pendingRequests = useMemo(() => data.requests.filter(x => x.status === "pending"), [data.requests]);

  return (
    <section className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="px-3 pb-3 pt-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-sky-600">QINGTIAN PAY</p>
          <h2 className="mt-1 text-sm font-bold text-slate-900">支付管理</h2>
          <p className="mt-1 text-xs text-slate-400">统一管理商户与资金</p>
        </div>
        <div className="mb-2 px-3 text-[11px] font-semibold text-slate-400">业务管理</div>
        <nav className="space-y-1" aria-label="晴天支付管理">
          {tabs.map(item => (
            <button key={item.id} onClick={() => setTab(item.id)} className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${tab === item.id ? "bg-sky-50 text-sky-700 ring-1 ring-sky-100" : "text-slate-600 hover:bg-slate-50"}`}>
              <span>{item.label}</span>
              <span className="flex items-center gap-2">
                {item.id === "withdrawals" && pendingWithdrawals.length > 0 ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-700">{pendingWithdrawals.length}</span> : null}
                {item.id === "requests" && pendingRequests.length > 0 ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-700">{pendingRequests.length}</span> : null}
                <span aria-hidden className="text-slate-300">›</span>
              </span>
            </button>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 space-y-4">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div><p className="text-xs text-slate-400">晴天支付 / 支付管理</p><h2 className="mt-0.5 font-semibold text-slate-900">{tabs.find(item => item.id === tab)?.label}</h2></div>
          <button className="btn-secondary !px-3 !py-2" onClick={() => void load()} disabled={loading}>{loading ? "刷新中…" : "刷新数据"}</button>
        </div>

      {message && <p role="status" className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-800">{message}</p>}
      {loading ? <div className="rounded-2xl bg-white p-12 text-center text-sm text-slate-500">正在读取支付管理数据…</div> : (
        <>
          {tab === "merchants" && <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-4"><h2 className="font-semibold text-slate-900">商户管理</h2><p className="mt-1 text-xs text-slate-500">余额按商户账本最新余额展示；商户名称使用站点昵称。</p></div>
            <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500"><tr>{["商户号","昵称 / 站点","余额（USDT）","状态","操作"].map(x=><th key={x} className="px-4 py-3 font-semibold">{x}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100">{data.merchants.map(m=><tr key={m.id}>
                <td className="px-4 py-3 font-mono text-xs">{m.merchant_no || "—"}</td>
                <td className="px-4 py-3"><p className="font-medium text-slate-900">{m.site_name}</p><p className="text-xs text-slate-400">{m.site_url || "未填写站点地址"}</p></td>
                <td className="px-4 py-3 font-semibold tabular-nums">{usdt(m.balance_micro)}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass(m.status)}`}>{statusLabel[m.status] || m.status}</span></td>
                <td className="px-4 py-3">{m.status === "suspended"
                  ? <button disabled={!!busy} onClick={()=>void act(m.id,{action:"unfreeze_merchant",merchantId:m.id})} className="btn-secondary !px-3 !py-1.5">解冻</button>
                  : <button disabled={!!busy} onClick={()=>void act(m.id,{action:"freeze_merchant",merchantId:m.id})} className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50">冻结</button>}</td>
              </tr>)}</tbody>
            </table></div>
            {data.merchants.length === 0 && <p className="p-8 text-center text-sm text-slate-500">暂无商户记录</p>}
          </div>}

          {tab === "orders" && <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4"><div><h2 className="font-semibold text-slate-900">全站订单</h2><p className="mt-1 text-xs text-slate-500">按创建时间倒序排列</p></div>
              <select value={orderStatus} onChange={e=>setOrderStatus(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"><option value="all">全部状态</option><option value="pending">待支付</option><option value="paid">已支付</option><option value="expired">已过期</option><option value="cancelled">已取消</option><option value="refunded">已退款</option></select>
            </div>
            <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500"><tr>{["平台订单号","商户","商户订单号","金额","状态","创建时间","支付时间"].map(x=><th key={x} className="px-4 py-3 font-semibold">{x}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100">{data.orders.map(o=><tr key={o.id}>
                <td className="px-4 py-3 font-mono text-xs">{o.trade_no}</td><td className="px-4 py-3">{o.merchant_no || o.site_name || "—"}</td><td className="px-4 py-3 font-mono text-xs">{o.out_trade_no}</td>
                <td className="px-4 py-3 font-semibold">{o.currency === "USDT" ? usdt(o.amount_micro || 0) + " USDT" : money(o.amount_cents) + " CNY"}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass(o.status)}`}>{statusLabel[o.status] || o.status}</span></td><td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">{date(o.created_at)}</td><td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">{date(o.paid_at)}</td>
              </tr>)}</tbody></table></div>
            {data.orders.length === 0 && <p className="p-8 text-center text-sm text-slate-500">当前筛选条件下没有订单</p>}
          </div>}

          {tab === "withdrawals" && <div className="space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4"><h2 className="font-semibold text-slate-900">提现审核</h2><p className="mt-1 text-xs text-slate-500">只有在外部转账已经实际完成后，才填写交易哈希并确认已打款。</p></div>
            {pendingWithdrawals.map(w=>{
              const info=bankInfo(w.bank_account_info); const image=imageValue(info);
              return <article key={w.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold text-slate-900">{w.request_no}</p><p className="mt-1 text-xs text-slate-500">{w.site_name || w.merchant_no || w.user_email || w.user_id} · {date(w.requested_at)}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass(w.status)}`}>{statusLabel[w.status] || w.status}</span></div>
                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3"><p>提现类型：<b>{w.withdraw_type === "fiat" ? "法币提现" : "USDT 提现"}</b></p><p>申请金额：<b>{w.currency === "CNY" ? money(w.payout_amount_cents) + " CNY" : usdt(w.amount_micro) + " USDT"}</b></p><p>手续费：<b>{w.currency === "CNY" ? money(w.fee_amount) + " CNY" : usdt(w.fee_micro) + " USDT"}</b></p></div>
                {w.withdraw_type === "fiat" && <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm">
                  <p className="mb-2 font-semibold text-slate-700">法币实名及收款资料</p>
                  {Object.entries(info).filter(([key])=>!["qr_code","qrCode","qr_image","qrImage","image_url","imageUrl","image"].includes(key)).map(([key,value])=><p key={key} className="break-all text-slate-600">{key}：{String(value ?? "—")}</p>)}
                  {image && <img src={image} alt="商户收款二维码" className="mt-3 max-h-52 max-w-52 rounded-lg border border-slate-200 object-contain" />}
                </div>}
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <input value={hashes[w.id] || ""} onChange={e=>setHashes(p=>({...p,[w.id]:e.target.value}))} placeholder="填写已完成转账的交易哈希 / 打款凭证" className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500" />
                  <button disabled={!!busy || (hashes[w.id] || "").trim().length < 6} onClick={()=>void act(w.id,{action:"mark_withdrawal_paid",withdrawalId:w.id,payoutReference:(hashes[w.id] || "").trim()})} className="btn-primary shrink-0">{busy===w.id ? "提交中…" : "确认已打款"}</button>
                </div>
              </article>
            })}
            {pendingWithdrawals.length === 0 && <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">暂无待处理提现申请</p>}
          </div>}

          {tab === "requests" && <div className="space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4"><h2 className="font-semibold text-slate-900">API 权限申请</h2><p className="mt-1 text-xs text-slate-500">查看关联工单及商户说明；同意后将开启该商户 API 调用权限。</p></div>
            {data.requests.map(r=>{
              const messages=data.messages.filter(m=>m.ticket_id===r.ticket_id);
              return <article key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold text-slate-900">{r.app_name}</p><p className="mt-1 text-xs text-slate-500">{r.merchant_no || r.site_name || r.user_email} · {date(r.created_at)}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass(r.status)}`}>{statusLabel[r.status] || r.status}</span></div>
                <div className="mt-3 space-y-1 text-sm text-slate-600"><p>申请类型：{r.app_type === "website" ? "网站" : r.app_type === "bot" ? "机器人" : "应用"}</p><p>申请地址：{r.website_url || "—"}</p><p>关联工单：{r.ticket_subject || r.ticket_id}</p></div>
                {messages.length>0 && <div className="mt-3 space-y-2 rounded-xl bg-slate-50 p-3">{messages.map(m=><div key={m.id} className="text-sm"><span className="mr-2 text-xs font-semibold text-sky-700">{m.sender_role==="merchant"?"商户":m.sender_role==="admin"?"管理员":m.sender_role==="ai"?"AI":"系统"}</span><span className="whitespace-pre-wrap break-words text-slate-700">{m.content}</span></div>)}</div>}
                {r.status === "pending" && <div className="mt-4 flex flex-wrap gap-2"><button disabled={!!busy} onClick={()=>void act(r.id,{action:"approve_api_access",requestId:r.id})} className="btn-primary !px-3 !py-2">同意并开通 API</button><button disabled={!!busy} onClick={()=>void act(r.id,{action:"reject_api_access",requestId:r.id})} className="rounded-xl border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50">拒绝申请</button></div>}
              </article>
            })}
            {data.requests.length===0 && <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">暂无 API 权限申请工单</p>}
          </div>}
        </>
      )}
      </div>
    </section>
  );
}
