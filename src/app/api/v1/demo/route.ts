import { NextResponse } from "next/server";

/** @deprecated 已迁移至 POST /api/v1/send */
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: "该接口已废弃，请使用 POST /api/v1/send",
    },
    { status: 410 }
  );
}

export async function POST() {
  return GET();
}
