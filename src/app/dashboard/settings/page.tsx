import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { defaultFromEmail } from "@/lib/resend";
import { SettingsTester } from "./settings-tester";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">设置</h1>
      <p className="mt-2 text-slate-600">查看系统发件配置，并测试你的 API Key。</p>

      <div className="card mt-6 max-w-xl space-y-4 p-6">
        <div>
          <p className="text-sm font-medium text-slate-700">系统默认发件人</p>
          <p className="mt-1 font-mono text-sm text-slate-900">{defaultFromEmail}</p>
          <p className="mt-1 text-xs text-slate-500">
            来自环境变量 RESEND_FROM_EMAIL
          </p>
        </div>
      </div>

      <div className="card mt-6 max-w-xl p-6">
        <h2 className="text-lg font-semibold text-slate-900">测试发件 API</h2>
        <p className="mt-1 text-sm text-slate-500">
          粘贴完整 API Key，向指定邮箱发送一封测试邮件，验证鉴权与发信是否正常。
        </p>
        <SettingsTester defaultTo={session.user.email || ""} />
      </div>
    </div>
  );
}
