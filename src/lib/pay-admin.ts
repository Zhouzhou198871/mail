import { getCloudflareContext } from "@opennextjs/cloudflare";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export interface PayD1Statement {
  bind(...values: (string | number | null)[]): PayD1Statement;
  all<T = Record<string, unknown>>(): Promise<{ results: T[]; success: boolean }>;
  run(): Promise<{ success?: boolean; meta?: { changes?: number } }>;
}
export interface PayD1Database {
  prepare(sql: string): PayD1Statement;
}

export async function getPayAdminContext(): Promise<
  | { ok: true; db: PayD1Database; admin: { id: string; email: string }; userId: string }
  | { ok: false; status: 401 | 403; error: string }
> {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase().trim();
  if (!email || !session?.user?.id) {
    return { ok: false, status: 401, error: "请先登录管理员账号" };
  }

  const admin = await prisma.admin.findUnique({
    where: { email },
    select: { id: true, email: true },
  });
  if (!admin) {
    return { ok: false, status: 403, error: "当前账号没有管理员权限" };
  }

  const { env } = getCloudflareContext();
  const db = (env as unknown as { PAY_DB?: PayD1Database }).PAY_DB;
  if (!db) {
    throw new Error("PAY_DB 数据库绑定不可用");
  }

  return { ok: true, db, admin, userId: session.user.id };
}
