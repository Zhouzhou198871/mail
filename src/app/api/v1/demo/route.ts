import { NextResponse } from "next/server";
import { verifyApiKeyFromRequest } from "@/lib/api-key";

export async function GET(request: Request) {
  const authResult = await verifyApiKeyFromRequest(request);
  if (!authResult.ok) {
    return NextResponse.json(
      { code: 401, msg: authResult.error || "未授权", time: Date.now() },
      { status: 401 }
    );
  }

  return NextResponse.json({
    code: 200,
    msg: "晴天支付接口验证成功",
    time: Date.now(),
  });
}

export async function POST(request: Request) {
  return GET(request);
}
