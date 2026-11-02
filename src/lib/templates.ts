export type MailTemplate = {
  id: string;
  name: string;
  subject: string;
  body: string;
};

/** Plain-text friendly templates (rendered as simple HTML when sending) */
export const MAIL_TEMPLATES: MailTemplate[] = [
  {
    id: "verify",
    name: "验证码通知",
    subject: "您的验证码",
    body: "您好，您的验证码是：123456。\n10 分钟内有效，请勿泄露给他人。",
  },
  {
    id: "welcome",
    name: "欢迎注册",
    subject: "欢迎加入",
    body: "欢迎注册成功！\n感谢您的信任，如有问题随时联系我们。",
  },
  {
    id: "reset",
    name: "重置密码",
    subject: "重置密码提醒",
    body: "我们收到了您的重置密码请求。\n若非本人操作，请忽略本邮件。",
  },
  {
    id: "order",
    name: "订单确认",
    subject: "订单已确认",
    body: "您的订单已确认，我们正在为您处理。\n感谢惠顾！",
  },
  {
    id: "ship",
    name: "发货通知",
    subject: "包裹已发出",
    body: "您的包裹已发出，请注意查收。\n物流信息将稍后更新。",
  },
  {
    id: "invoice",
    name: "账单提醒",
    subject: "账单提醒",
    body: "您有一笔待处理账单，请及时查看并完成支付。",
  },
  {
    id: "alert",
    name: "安全提醒",
    subject: "账户安全提醒",
    body: "检测到您的账户有异常登录尝试。\n如非本人操作，请尽快修改密码。",
  },
  {
    id: "promo",
    name: "活动通知",
    subject: "限时活动开始啦",
    body: "专属活动现已开启，快来看看有哪些优惠吧！",
  },
  {
    id: "feedback",
    name: "反馈收到",
    subject: "已收到您的反馈",
    body: "我们已收到您的反馈，会尽快处理并回复您。",
  },
  {
    id: "test",
    name: "测试邮件",
    subject: "MailHub 测试发信",
    body: "这是一封测试邮件。\n若你收到此信，说明发件通道工作正常。",
  },
];

export function templateToHtml(body: string): string {
  const escaped = body
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const paragraphs = escaped
    .split(/\n+/)
    .map((line) => `<p style="margin:0 0 12px;line-height:1.6;color:#334155;">${line}</p>`)
    .join("");
  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:480px;margin:0 auto;padding:24px;">${paragraphs}</div>`;
}
