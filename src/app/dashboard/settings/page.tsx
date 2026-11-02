import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      email: true,
      notificationEmail: true,
      receiveEmailAlerts: true,
    },
  });

  if (!user) redirect("/login");

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">设置</h1>
      <p className="mt-2 text-slate-600">管理交易通知邮箱与邮件提醒。</p>
      <SettingsForm
        loginEmail={user.email}
        notificationEmail={user.notificationEmail || user.email}
        receiveEmailAlerts={user.receiveEmailAlerts}
      />
    </div>
  );
}
