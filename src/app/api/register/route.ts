import { NextResponse } from "next/server";

// 密码注册已废弃，统一使用邮箱验证码登录/注册
export async function POST() {
  return NextResponse.json(
    { error: "请使用邮箱验证码登录/注册" },
    { status: 410 }
  );
}
