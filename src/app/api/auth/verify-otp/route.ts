import { NextRequest, NextResponse } from "next/server";
import { verifyOTP } from "@/lib/otp";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email || "").toString().trim().toLowerCase();
    const code = (body.code || "").toString().trim();

    if (!email || !code) {
      return NextResponse.json({ error: "邮箱和验证码不能为空" }, { status: 400 });
    }

    const result = verifyOTP(email, code);
    if (!result.ok) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    const cookieStore = await cookies();
    cookieStore.set("qt_session", JSON.stringify({ email, loggedInAt: Date.now() }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return NextResponse.json({
      success: true,
      message: "登录成功",
      email,
    });
  } catch (err: any) {
    console.error("[verify-otp]", err);
    return NextResponse.json(
      { error: err?.message || "验证失败" },
      { status: 500 }
    );
  }
}
