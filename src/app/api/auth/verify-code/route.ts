import { NextRequest, NextResponse } from "next/server";
import { verifyOTP } from "@/lib/otp";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email || "").toString().trim().toLowerCase();
    const code = (body.code || "").toString().trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "请输入有效的邮箱地址" }, { status: 400 });
    }

    if (!code || code.length !== 6) {
      return NextResponse.json({ error: "请输入 6 位验证码" }, { status: 400 });
    }

    const result = await verifyOTP(email, code);
    if (!result.ok) {
      return NextResponse.json({ error: result.message || "验证失败" }, { status: 400 });
    }

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({ data: { email } });
    }

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email },
    });
  } catch (err: unknown) {
    console.error("[verify-code]", err);
    return NextResponse.json({ error: "验证失败，请稍后重试" }, { status: 500 });
  }
}
