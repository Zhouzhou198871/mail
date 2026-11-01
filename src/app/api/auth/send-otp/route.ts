import { NextRequest, NextResponse } from "next/server";
import { generateOTP, saveOTP } from "@/lib/otp";
import { sendOTPEmail } from "@/lib/resend";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email || "").toString().trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "请输入有效的邮箱地址" }, { status: 400 });
    }

    const code = generateOTP();
    saveOTP(email, code);

    await sendOTPEmail(email, code);

    return NextResponse.json({
      success: true,
      message: "验证码已发送，请查收邮件",
    });
  } catch (err: any) {
    console.error("[send-otp]", err);
    return NextResponse.json(
      { error: err?.message || "发送失败，请稍后重试" },
      { status: 500 }
    );
  }
}
