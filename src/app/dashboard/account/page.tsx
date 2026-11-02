import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ensureBootstrapAdmins } from "@/lib/admins";
import { AccountClient } from "./account-client";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  await ensureBootstrapAdmins();

  const admins = await prisma.admin.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true, createdAt: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">个人中心</h1>
        <p className="mt-1 text-sm text-slate-500">
          当前账号：{session.user.email}
        </p>
      </div>

      <AccountClient
        currentEmail={session.user.email}
        admins={admins.map((a) => ({
          id: a.id,
          email: a.email,
          createdAt: a.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
