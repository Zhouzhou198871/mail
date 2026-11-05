import { NextResponse } from "next/server";
import { z } from "zod";
import { getPayAdminContext } from "@/lib/pay-admin";


const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("freeze_merchant"), merchantId: z.string().min(1) }),
  z.object({ action: z.literal("unfreeze_merchant"), merchantId: z.string().min(1) }),
  z.object({
    action: z.literal("mark_withdrawal_paid"),
    withdrawalId: z.string().min(1),
    payoutReference: z.string().trim().min(6, "请填写有效的交易哈希或打款凭证").max(200),
  }),
  z.object({ action: z.literal("approve_api_access"), requestId: z.string().min(1) }),
  z.object({ action: z.literal("reject_api_access"), requestId: z.string().min(1) }),
]);

export async function GET(request: Request) {
  const context = await getPayAdminContext();
  if (!context.ok) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const { db } = context;
  const url = new URL(request.url);
  const orderStatus = url.searchParams.get("orderStatus") || "all";
  const validStatuses = ["pending", "paid", "expired", "cancelled", "refunded"];
  const filter = validStatuses.includes(orderStatus) ? orderStatus : "all";

  const [merchants, orders, withdrawals, requests, messages] = await Promise.all([
    db.prepare(`
      SELECT m.id, m.merchant_no, m.site_name, m.site_url, m.status, m.api_access_granted,
        m.created_at,
        COALESCE((
          SELECT l.balance_after_micro FROM merchant_ledger l
          WHERE l.user_id = m.user_id ORDER BY l.created_at DESC, l.id DESC LIMIT 1
        ), 0) AS balance_micro
      FROM pay_merchants m
      ORDER BY m.created_at DESC LIMIT 300
    `).all(),
    db.prepare(`
      SELECT o.id, o.trade_no, o.out_trade_no, o.amount_cents, o.amount_micro,
        o.currency, o.method, o.subject, o.status, o.created_at, o.paid_at,
        o.provider_trade_no, m.merchant_no, m.site_name
      FROM payment_orders o
      LEFT JOIN pay_merchants m ON m.id = o.merchant_id
      WHERE (? = 'all' OR o.status = ?)
      ORDER BY o.created_at DESC LIMIT 500
    `).bind(filter, filter).all(),
    db.prepare(`
      SELECT w.id, w.request_no, w.user_id, w.amount_micro, w.fee_micro, w.currency,
        w.destination_masked, w.status, w.requested_at, w.reviewed_at,
        w.payout_reference, w.withdraw_type, w.bank_account_info,
        w.payout_amount_micro, w.payout_amount_cents, w.admin_note,
        u.email AS user_email, m.merchant_no, m.site_name
      FROM merchant_withdrawals w
      LEFT JOIN users u ON u.id = w.user_id
      LEFT JOIN pay_merchants m ON m.user_id = w.user_id
      ORDER BY w.requested_at DESC LIMIT 300
    `).all(),
    db.prepare(`
      SELECT r.id, r.ticket_id, r.user_id, r.merchant_id, r.app_type, r.app_name,
        r.website_url, r.status, r.reviewed_at, r.review_note, r.created_at,
        t.subject AS ticket_subject, t.status AS ticket_status,
        m.merchant_no, m.site_name, u.email AS user_email
      FROM api_access_requests r
      LEFT JOIN support_tickets t ON t.id = r.ticket_id
      LEFT JOIN pay_merchants m ON m.id = r.merchant_id
      LEFT JOIN users u ON u.id = r.user_id
      ORDER BY r.created_at DESC LIMIT 300
    `).all(),
    db.prepare(`
      SELECT c.id, c.ticket_id, c.sender_role, c.message_type, c.content, c.created_at
      FROM chat_messages c
      INNER JOIN api_access_requests r ON r.ticket_id = c.ticket_id
      ORDER BY c.created_at ASC LIMIT 1000
    `).all(),
  ]);

  return NextResponse.json({
    merchants: merchants.results,
    orders: orders.results,
    withdrawals: withdrawals.results,
    requests: requests.results,
    messages: messages.results,
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const context = await getPayAdminContext();
  if (!context.ok) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const body = await request.json().catch(() => null);
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "提交内容不正确" }, { status: 400 });
  }

  const { db, admin } = context;
  const action = parsed.data;

  try {
    if (action.action === "freeze_merchant") {
      const result = await db.prepare(`
        UPDATE pay_merchants
        SET suspended_previous_status = CASE
          WHEN status != 'suspended' THEN status ELSE suspended_previous_status END,
          status = 'suspended'
        WHERE id = ? AND status != 'suspended'
      `).bind(action.merchantId).run();
      if (!result.meta?.changes) {
        return NextResponse.json({ error: "商户不存在或已经冻结" }, { status: 409 });
      }
    }

    if (action.action === "unfreeze_merchant") {
      const result = await db.prepare(`
        UPDATE pay_merchants
        SET status = COALESCE(NULLIF(suspended_previous_status, ''), 'active'),
          suspended_previous_status = NULL
        WHERE id = ? AND status = 'suspended'
      `).bind(action.merchantId).run();
      if (!result.meta?.changes) {
        return NextResponse.json({ error: "商户不存在或当前未冻结" }, { status: 409 });
      }
    }

    if (action.action === "mark_withdrawal_paid") {
      const result = await db.prepare(`
        UPDATE merchant_withdrawals
        SET status = 'paid', payout_reference = ?, reviewed_at = ?,
          admin_user_id = ?, admin_note = '管理员确认已完成线下打款'
        WHERE id = ? AND status IN ('pending', 'approved', 'processing')
      `).bind(action.payoutReference, Math.floor(Date.now() / 1000), admin.id, action.withdrawalId).run();
      if (!result.meta?.changes) {
        return NextResponse.json({ error: "提现申请不存在或已处理" }, { status: 409 });
      }
    }

    if (action.action === "approve_api_access" || action.action === "reject_api_access") {
      const nextStatus = action.action === "approve_api_access" ? "approved" : "rejected";
      const result = await db.prepare(`
        UPDATE api_access_requests
        SET status = ?, reviewed_at = ?, review_note = ?
        WHERE id = ? AND status = 'pending'
      `).bind(
        nextStatus,
        Math.floor(Date.now() / 1000),
        `由 MailHub 管理员 ${admin.email} 审批`,
        action.requestId
      ).run();
      if (!result.meta?.changes) {
        return NextResponse.json({ error: "申请不存在或已处理" }, { status: 409 });
      }

      if (nextStatus === "approved") {
        await db.prepare(`
          UPDATE pay_merchants
          SET api_access_granted = 1
          WHERE id = (SELECT merchant_id FROM api_access_requests WHERE id = ?)
        `).bind(action.requestId).run();
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[mail-admin/payments]", error);
    return NextResponse.json({ error: "操作未能完成，请稍后重试" }, { status: 500 });
  }
}
