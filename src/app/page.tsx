"use client";

import { FormEvent, useMemo, useState } from "react";

const navItems = [
  { label: "产品", href: "#features" },
  { label: "费率", href: "#pricing" },
  { label: "客户评价", href: "#testimonials" },
  { label: "联系", href: "#contact" },
];

const paymentFlows = [
  { id: "QTP-241101-8821", type: "收款", amount: 1280, actual: 1152, label: "电商订单" },
  { id: "QTP-241101-8834", type: "代付", amount: 680, actual: 612, label: "发薪" },
  { id: "QTP-241101-8847", type: "收款", amount: 2360, actual: 2124, label: "SaaS 订阅" },
  { id: "QTP-241101-8859", type: "代付", amount: 950, actual: 855, label: "供应链结算" },
  { id: "QTP-241101-8872", type: "收款", amount: 540, actual: 486, label: "高频收益" },
];

const features = [
  {
    title: "聚合收款 API",
    description:
      "统一接入多渠道收款能力，支持在线支付、订阅结算与订单回调，快速搭建商户收款链路。",
    badge: "高可用",
    accent: "from-sky-500/25 to-cyan-500/5",
  },
  {
    title: "自动代付下发",
    description:
      "根据规则自动发放代付资金，支持批量转账、实时结算与状态回调，显著降低人工审核成本。",
    badge: "低门槛",
    accent: "from-violet-500/25 to-indigo-500/5",
  },
  {
    title: "USDT 极速结算",
    description:
      "以 USDT 为结算单元，打通跨境支付场景，支持高效提现与稳定到账，覆盖全球商户需求。",
    badge: "全球化",
    accent: "from-emerald-500/25 to-teal-500/5",
  },
];

const testimonials = [
  {
    name: "林先生",
    role: "跨境电商商户",
    text: "晴天支付的 API 接口非常稳定，收款和代付流程一体化，帮我们把运营效率提升了近 40%。",
  },
  {
    name: "吴女士",
    role: "内容平台负责人",
    text: "USDT 结算速度很快，提现规则清晰，客服支持也很及时，整体体验远超同类服务。",
  },
  {
    name: "赵经理",
    role: "SaaS 服务商",
    text: "从接入到上线只用了一个下午，监控数据和回调稳定性都很不错，节省了大量维护成本。",
  },
];

export default function Home() {
  const [selectedFlow, setSelectedFlow] = useState<(typeof paymentFlows)[number] | null>(null);
  const [amount, setAmount] = useState("1200");
  const [email, setEmail] = useState("");
  const [emailState, setEmailState] = useState<{
    type: "error" | "success" | null;
    message: string;
  }>({ type: null, message: "" });

  const numericAmount = useMemo(() => {
    const value = Number(amount);
    return Number.isFinite(value) && value > 0 ? value : 0;
  }, [amount]);

  const feeAmount = useMemo(() => Number((numericAmount * 0.1).toFixed(2)), [numericAmount]);
  const actualAmount = useMemo(() => Number((numericAmount * 0.9).toFixed(2)), [numericAmount]);

  const handleEmailSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = email.trim();
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);

    if (!isValid) {
      setEmailState({
        type: "error",
        message: "请输入有效的工作邮箱，方便我们为您安排专属服务。",
      });
      return;
    }

    setEmailState({
      type: "success",
      message: "登记成功！我们的商务团队会尽快联系您。",
    });
    setEmail("");
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* 固定导航栏 · 磨砂玻璃 */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <a href="#top" className="flex items-center gap-3" aria-label="晴天支付首页">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-cyan-500 text-lg font-bold text-slate-950 shadow-lg shadow-sky-500/25">
              晴
            </div>
            <div>
              <p className="text-base font-semibold tracking-wide text-white">晴天支付</p>
              <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Qingtian Pay</p>
            </div>
          </a>

          <nav className="hidden items-center gap-8 md:flex">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm text-slate-300 transition hover:text-white"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="#contact"
              className="hidden rounded-full border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-sky-400/80 hover:text-white sm:inline-flex"
            >
              立即接入
            </a>
            <a
              href="#pricing"
              className="inline-flex rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
            >
              获取方案
            </a>
          </div>
        </div>
      </header>

      <div id="top" className="mx-auto max-w-7xl px-4 pb-20 pt-28 sm:px-6 lg:px-8 lg:pt-32">
        {/* Hero */}
        <section className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-sky-200">
              稳定收款 · 极速代付
            </div>
            <h1 className="mt-6 max-w-xl text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              稳定收款，极速代付 —— 专为商户打造的易支付 API
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
              为商户提供安全、快速、可扩展的支付能力，支持收款与代付，统一费率 10%，USDT
              极速结算，帮助你高效经营全球订单。
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="#pricing"
                className="inline-flex rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-500/30 transition hover:bg-sky-400"
              >
                查看费率
              </a>
              <a
                href="#features"
                className="inline-flex rounded-full border border-slate-700 bg-slate-900/60 px-6 py-3 text-sm font-semibold text-white transition hover:border-slate-500 hover:bg-slate-800"
              >
                了解功能
              </a>
            </div>

            <div className="mt-10 grid max-w-lg grid-cols-3 gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-2xl font-bold text-white">99.9%</div>
                <div className="mt-2 text-sm text-slate-400">稳定率</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-2xl font-bold text-white">&lt; 3s</div>
                <div className="mt-2 text-sm text-slate-400">回调响应</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-2xl font-bold text-white">24/7</div>
                <div className="mt-2 text-sm text-slate-400">风控监控</div>
              </div>
            </div>
          </div>

          {/* 模拟 API 流水 */}
          <div className="relative">
            <div className="absolute inset-0 -z-10 rounded-[2rem] bg-gradient-to-br from-sky-500/30 via-cyan-500/20 to-transparent blur-3xl" />
            <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-5 shadow-2xl shadow-sky-500/10 backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">模拟 API 流水</p>
                  <h2 className="mt-2 text-xl font-semibold text-white">实时交易记录</h2>
                </div>
                <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
                  正常运行
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {paymentFlows.map((flow) => (
                  <button
                    key={flow.id}
                    type="button"
                    onClick={() => setSelectedFlow(flow)}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 p-4 text-left transition hover:border-sky-400/60 hover:bg-slate-900"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                          {flow.label}
                        </p>
                        <p className="mt-1 text-sm text-slate-300">{flow.id}</p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                          flow.type === "收款"
                            ? "bg-emerald-500/15 text-emerald-300"
                            : "bg-sky-500/15 text-sky-300"
                        }`}
                      >
                        {flow.type}
                      </span>
                    </div>

                    <div className="mt-3 flex items-end justify-between">
                      <div>
                        <p className="text-xs text-slate-500">金额</p>
                        <p className="mt-1 text-xl font-semibold text-white">{flow.amount} USDT</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500">实际到账</p>
                        <p className="mt-1 text-lg font-semibold text-sky-300">{flow.actual} USDT</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 功能网格 */}
        <section id="features" className="mt-28 scroll-mt-28">
          <div className="mb-10 text-center">
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-sky-300">功能模块</p>
            <h2 className="mt-4 text-3xl font-bold text-white sm:text-4xl">
              面向商户的全链路支付能力
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.title}
                className={`rounded-[1.75rem] border border-white/10 bg-gradient-to-br ${feature.accent} p-px shadow-2xl shadow-slate-950/10`}
              >
                <div className="h-full rounded-[1.7rem] bg-slate-950/90 p-7">
                  <div className="inline-flex rounded-full border border-sky-400/30 bg-sky-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-300">
                    {feature.badge}
                  </div>
                  <h3 className="mt-5 text-2xl font-bold text-white">{feature.title}</h3>
                  <p className="mt-4 text-base leading-7 text-slate-300">{feature.description}</p>
                  <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-sky-300">
                    了解详情
                    <span aria-hidden="true">→</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* 费率区 + 计算器 */}
        <section id="pricing" className="mt-28 scroll-mt-28">
          <div className="rounded-[2rem] border border-sky-500/20 bg-gradient-to-r from-sky-500/15 via-slate-900 to-cyan-500/10 p-6 sm:p-8 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-[1fr_0.75fr] lg:items-center">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.22em] text-sky-300">费率标准</p>
                <h2 className="mt-4 text-3xl font-bold text-white sm:text-4xl">
                  统一费率 10% / 提现 ≥100U 免手续费
                </h2>
                <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
                  商户只需关注单笔交易净额，无需复杂规则切换。每笔收款按 10% 统一扣除，提现金额在
                  100 USDT 以上时享免手续费，低于 100 USDT 时收取 5 USDT 固定服务费。
                </p>

                <div className="mt-8 flex flex-wrap gap-4">
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-400">统一收款</div>
                    <div className="mt-1 text-2xl font-bold text-white">10%</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-400">提现门槛</div>
                    <div className="mt-1 text-2xl font-bold text-white">≥100U</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-400">低额提现</div>
                    <div className="mt-1 text-2xl font-bold text-white">5U</div>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/80 p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-300">费用计算器</p>
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-emerald-300">
                    实时计算
                  </span>
                </div>

                <label htmlFor="trade-amount" className="mt-5 block text-sm text-slate-300">
                  交易金额（USDT）
                </label>
                <input
                  id="trade-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-lg text-white outline-none transition focus:border-sky-400"
                  placeholder="请输入金额"
                />

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">手续费</p>
                    <p className="mt-2 text-xl font-bold text-white">{feeAmount.toFixed(2)} USDT</p>
                  </div>
                  <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-sky-200">实际到账</p>
                    <p className="mt-2 text-xl font-bold text-sky-300">{actualAmount.toFixed(2)} USDT</p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-4 text-sm text-slate-300">
                  <span className="text-slate-500">公式：</span> 实际到账 = 交易金额 × (1 - 10%)
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 评价区 */}
        <section id="testimonials" className="mt-28 scroll-mt-28">
          <div className="mb-10 text-center">
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-sky-300">商户评价</p>
            <h2 className="mt-4 text-3xl font-bold text-white sm:text-4xl">全球商户的真实反馈</h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {testimonials.map((t) => (
              <article
                key={t.name}
                className="rounded-[1.75rem] border border-white/10 bg-slate-900/80 p-7"
              >
                <div className="flex items-center gap-1 text-yellow-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i}>★</span>
                  ))}
                </div>
                <p className="mt-5 text-base leading-7 text-slate-200">“{t.text}”</p>
                <div className="mt-6 border-t border-white/10 pt-4">
                  <p className="font-semibold text-white">{t.name}</p>
                  <p className="mt-1 text-sm text-slate-400">{t.role}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      {/* 页尾表单 */}
      <footer id="contact" className="border-t border-white/10 bg-slate-950/80 scroll-mt-28">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-sky-300">工作邮箱登记</p>
            <h2 className="mt-4 text-3xl font-bold text-white sm:text-4xl">
              立即获取商户专属接入方案
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
              预约专业顾问，接入收款与代付 API，配置 USDT 结算、风控策略与回调通知，最快 24h
              上线。
            </p>
          </div>

          <form
            onSubmit={handleEmailSubmit}
            className="rounded-[1.75rem] border border-white/10 bg-slate-900/80 p-6"
          >
            <label htmlFor="work-email" className="block text-sm font-medium text-slate-200">
              工作邮箱
            </label>
            <input
              id="work-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailState.type) setEmailState({ type: null, message: "" });
              }}
              placeholder="name@company.com"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-sky-400"
            />

            {emailState.type && (
              <p
                className={`mt-3 text-sm ${
                  emailState.type === "error" ? "text-rose-400" : "text-emerald-400"
                }`}
              >
                {emailState.message}
              </p>
            )}

            <button
              type="submit"
              className="mt-5 w-full rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
            >
              立即登记
            </button>
          </form>
        </div>

        <div className="border-t border-white/5 py-6 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} 晴天支付 · Qingtian Pay. All rights reserved.
        </div>
      </footer>

      {/* 流水详情弹窗 */}
      {selectedFlow && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setSelectedFlow(null)}
        >
          <div
            className="w-full max-w-md rounded-[1.75rem] border border-white/10 bg-slate-900 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">交易详情</h3>
              <button
                type="button"
                onClick={() => setSelectedFlow(null)}
                className="rounded-full p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
                aria-label="关闭"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/70 p-3">
                <span className="text-slate-400">订单号</span>
                <span className="font-medium text-white">{selectedFlow.id}</span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/70 p-3">
                <span className="text-slate-400">类型</span>
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                    selectedFlow.type === "收款"
                      ? "bg-emerald-500/15 text-emerald-300"
                      : "bg-sky-500/15 text-sky-300"
                  }`}
                >
                  {selectedFlow.type}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/70 p-3">
                <span className="text-slate-400">金额</span>
                <span className="font-medium text-white">{selectedFlow.amount} USDT</span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-sky-500/30 bg-sky-500/10 p-3">
                <span className="text-sky-200">扣除 10% 后实际到账</span>
                <span className="text-lg font-bold text-sky-300">{selectedFlow.actual} USDT</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
