import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

if (!RESEND_API_KEY) {
  console.warn("[MailHub] RESEND_API_KEY 未配置，邮件发送将失败");
}

export const resend = new Resend(RESEND_API_KEY || "re_placeholder");
export const defaultFromEmail = FROM_EMAIL;

export async function sendOTPEmail(email: string, code: string) {
  if (!RESEND_API_KEY) {
    throw new Error("邮件服务未配置，请联系管理员");
  }

  const { data, error } = await resend.emails.send({
    from: `MailHub <${FROM_EMAIL}>`,
    to: [email],
    subject: "【MailHub】您的登录验证码",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #0ea5e9; font-size: 24px; margin: 0;">MailHub</h1>
        </div>
        <p style="color: #334155; font-size: 16px; line-height: 1.6;">
          您好，您正在登录 MailHub 邮件调度中心。
        </p>
        <p style="color: #334155; font-size: 16px; line-height: 1.6;">您的验证码是：</p>
        <div style="background: #f0f9ff; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #0284c7;">${code}</span>
        </div>
        <p style="color: #64748b; font-size: 14px;">
          验证码 10 分钟内有效，请勿泄露给他人。如非本人操作，请忽略此邮件。
        </p>
      </div>
    `,
  });

  if (error) {
    console.error("[Resend] send error:", error);
    throw new Error(error.message || "邮件发送失败");
  }

  return data;
}

export async function sendTransactionalEmail(params: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!RESEND_API_KEY) {
    throw new Error("邮件服务未配置，请联系管理员");
  }

  const { data, error } = await resend.emails.send({
    from: `MailHub <${FROM_EMAIL}>`,
    to: [params.to],
    subject: params.subject,
    html: params.html,
  });

  if (error) {
    console.error("[Resend] transactional error:", error);
    throw new Error(error.message || "邮件发送失败");
  }

  return data;
}
