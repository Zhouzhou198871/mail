import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

if (!RESEND_API_KEY) {
  console.warn("[晴天支付] RESEND_API_KEY 未配置，邮件发送将失败");
}

export const resend = new Resend(RESEND_API_KEY || "re_placeholder");

export async function sendOTPEmail(email: string, code: string) {
  if (!RESEND_API_KEY) {
    throw new Error("邮件服务未配置，请联系管理员");
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `晴天支付 <${FROM_EMAIL}>`,
      to: [email],
      subject: "【晴天支付】您的登录验证码",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #0ea5e9; font-size: 24px; margin: 0;">晴天支付</h1>
          </div>
          <p style="color: #334155; font-size: 16px; line-height: 1.6;">
            您好，您正在登录晴天支付开发者平台。
          </p>
          <p style="color: #334155; font-size: 16px; line-height: 1.6;">
            您的验证码是：
          </p>
          <div style="background: #f0f9ff; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #0284c7;">${code}</span>
          </div>
          <p style="color: #64748b; font-size: 14px;">
            验证码 10 分钟内有效，请勿泄露给他人。如非本人操作，请忽略此邮件。
          </p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">
            晴天支付 · Qingtian Pay
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("[Resend] send error:", error);
      throw new Error(error.message || "邮件发送失败");
    }

    return data;
  } catch (err: any) {
    console.error("[Resend] exception:", err);
    throw new Error(err?.message || "邮件发送失败，请稍后重试");
  }
}
