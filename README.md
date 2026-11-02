# MailHub · 邮件调度中心

内部使用的邮件发件 API 网关：生成 API Key，供其他网站调用发信；管理面板支持模版发信、密钥、域名与发件通道。

## 技术栈

- Next.js (App Router) + Tailwind CSS
- NextAuth（账号密码，管理员表）
- Prisma + PostgreSQL（Netlify Database / `NETLIFY_DB_URL`）
- Resend 发信

## 环境变量

在 Netlify（或本地 `.env`）配置：

```bash
NETLIFY_DB_URL=           # PostgreSQL 连接串（构建时 prisma db push）
NEXTAUTH_SECRET=          # 随机长字符串
NEXTAUTH_URL=https://your-domain
RESEND_API_KEY=
RESEND_FROM_EMAIL=noreply@your-domain.com

# 可选：DNS / Cloudflare（勿提交到 Git）
CF_API_TOKEN=
CF_ACCOUNT_ID=
DNSHE_API_ID=
DNSHE_API_TOKEN=
```

## 发件 API（给其他网站对接）

```http
POST /api/v1/send
Authorization: Bearer sk_live_xxx
Content-Type: application/json

{
  "to": "user@example.com",
  "subject": "标题",
  "html": "<p>正文</p>"
}
```

成功响应：

```json
{ "success": true, "id": "resend_message_id" }
```

## 管理面板

| 路径 | 说明 |
|------|------|
| `/login` | 管理员登录 |
| `/dashboard` | 概览与统计弹窗 |
| `/dashboard/keys` | API 密钥（昵称 + 一次性明文） |
| `/dashboard/logs` | 发件（模版一键发送 + 记录） |
| `/dashboard/domains` | 域名绑定、CF/DNShe 状态 |
| `/dashboard/settings` | 额外发件 API 通道 |
| `/dashboard/account` | 改密、管理员、退出 |

默认会引导写入三个引导管理员（首次登录时写入数据库），可在个人中心继续添加。

## 本地开发

```bash
npm install
# 配置 .env
npm run dev
```

构建（含 Prisma generate + db push）：

```bash
npm run build
```

## 安全说明

- API Key 仅存 SHA-256，明文只在创建时展示一次
- Cloudflare / DNShe Token **只放环境变量**，不要写进仓库
- 建议对 `/api/v1/*` 做速率限制，并在边缘开启 Bot 防护
