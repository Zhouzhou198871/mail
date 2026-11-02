import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-slate-200">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-5 sm:px-6">
          <BrandLogo subtitle="邮件调度中心" size={36} />
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              登录
            </Link>
            <Link
              href="/login"
              className="rounded-lg bg-sky-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-600"
            >
              开始使用
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-600">
          Developer API
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
          通过 API Key 极速发送邮件
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
          MailHub 是独立的邮件发件调度中心。在控制台生成 API
          Key，其他网站只需一次 HTTP 请求即可发送事务邮件。
        </p>

        <section className="mt-14">
          <h2 className="text-xl font-semibold">快速开始</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-slate-600">
            <li>登录控制台并生成 API Key（格式 sk_live_...）</li>
            <li>使用 Bearer Token 调用下方发件接口</li>
            <li>在「发件日志」中查看发送记录</li>
          </ol>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold">发件接口</h2>
          <p className="mt-2 text-sm text-slate-500">
            <span className="rounded bg-emerald-50 px-1.5 py-0.5 font-mono text-emerald-700">
              POST
            </span>{" "}
            <code className="font-mono text-slate-800">/api/v1/send</code>
          </p>

          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-950">
            <div className="border-b border-white/10 px-4 py-2 text-xs text-slate-400">
              Request
            </div>
            <pre className="overflow-x-auto p-4 text-sm leading-6 text-slate-100">{`curl -X POST https://your-domain/api/v1/send \\
  -H "Authorization: Bearer sk_live_xxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "user@example.com",
    "subject": "Hello from MailHub",
    "html": "<p>邮件正文 HTML</p>"
  }'`}</pre>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-950">
            <div className="border-b border-white/10 px-4 py-2 text-xs text-slate-400">
              Success Response
            </div>
            <pre className="overflow-x-auto p-4 text-sm leading-6 text-emerald-300">{`{
  "success": true,
  "id": "resend_message_id"
}`}</pre>
          </div>
        </section>

        <section className="mt-12 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 p-5">
            <p className="font-semibold">API Key 鉴权</p>
            <p className="mt-2 text-sm text-slate-600">
              仅存储密钥哈希，支持随时吊销。
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 p-5">
            <p className="font-semibold">Resend 发信</p>
            <p className="mt-2 text-sm text-slate-600">
              稳定投递事务邮件，适合验证码与通知。
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 p-5">
            <p className="font-semibold">发件日志</p>
            <p className="mt-2 text-sm text-slate-600">
              每次调用自动落库，便于排查与审计。
            </p>
          </div>
        </section>
      </div>

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} MailHub · 邮件调度中心
      </footer>
    </main>
  );
}
