import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { defaultFromEmail } from "@/lib/resend";
import { SettingsKeyPanel } from "./settings-key-panel";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">⚙️ 发件配置</h1>
        <p className="mt-2 text-slate-600">查看系统发件人，并一键生成对接用 API Key。</p>
      </div>

      <div className="card max-w-xl space-y-2 p-6">
        <p className="text-sm font-medium text-slate-700">当前系统发件人</p>
        <p className="font-mono text-base text-slate-900">
          {defaultFromEmail}
        </p>
        <p className="text-xs text-slate-500">
          来自环境变量 RESEND_FROM_EMAIL（例如 noreply@lynli.me）
        </p>
      </div>

      <div className="card max-w-xl p-6">
        <h2 className="text-lg font-semibold text-slate-900">API Key</h2>
        <p className="mt-1 text-sm text-slate-500">
          一键生成密钥，复制后用于其他网站对接 MailHub 发件接口。
        </p>
        <SettingsKeyPanel />
      </div>
    </div>
  );
}
