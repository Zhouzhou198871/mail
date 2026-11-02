import { NextResponse } from "next/server";

// 管理面板仅使用管理员账号密码登录；禁用公开验证码发信入口，避免被滥用。
export async function POST() {
  return NextResponse.json(
    { success: false, error: "此验证码入口已停用，请使用管理员账号登录" },
    { status: 410 }
  );
}
