import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "./dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const isAdmin = session.user.email
    ? !!(await prisma.admin.findUnique({
        where: { email: session.user.email.toLowerCase() },
        select: { id: true },
      }))
    : false;

  return <DashboardShell isAdmin={isAdmin}>{children}</DashboardShell>;
}
