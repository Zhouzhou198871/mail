import { Resend } from "resend";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const defaultFromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

function getMailConfig() {
  try {
    const { env } = getCloudflareContext();
    const runtime = env as unknown as {
      RESEND_API_KEY?: string;
      RESEND_FROM_EMAIL?: string;
    };
    return {
      apiKey: runtime.RESEND_API_KEY || process.env.RESEND_API_KEY || "",
      fromEmail: runtime.RESEND_FROM_EMAIL || defaultFromEmail,
    };
  } catch {
    return {
      apiKey: process.env.RESEND_API_KEY || "",
      fromEmail: defaultFromEmail,
    };
  }
}

function getResendClient() {
  const config = getMailConfig();
  if (!config.apiKey) throw new Error("邮件服务未配置，请联系管理员");
  return { client: new Resend(config.apiKey), fromEmail: config.fromEmail };
}

export async function sendOTPEmail(email: string, code: string) {
  const { client, fromEmail } = getResendClient();
  const { data, error } = await client.emails.send({
    from: `MailHub <${fromEmail}>`,
    to: [email],
    subject: "【MailHub】您的登录验证码",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <div style="text-align: center; margin-bottom: 24px;"><h1 style="color: #0ea5e9; font-size: 24px; margin: 0;">MailHub</h1></div>
        <p style="color: #334155; font-size: 16px; line-height: 1.6;">您好，您正在登录 MailHub 邮件调度中心。</p>
        <p style="color: #334155; font-size: 16px; line-height: 1.6;">您的验证码是：</p>
        <div style="background: #f0f9ff; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #0284c7;">${code}</span>
        </div>
        <p style="color: #64748b; font-size: 14px;">验证码 10 分钟内有效，请勿泄露给他人。如非本人操作，请忽略此邮件。</p>
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
  const { client, fromEmail } = getResendClient();
  const { data, error } = await client.emails.send({
    from: `MailHub <${fromEmail}>`,
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
