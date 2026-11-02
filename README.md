# MailHub · 邮件配置管理中心

MailHub 是内部使用的邮件配置管理面板，不是公共邮箱网站，也不开放公众自行注册。管理员在这里维护邮件发送配置、生成 API Key，供其他网站或系统通过服务端 API 调用。

生产入口：https://mail.lynli.me

## 功能范围

- 三个初始管理员账号登录；管理员可在面板创建和管理其他管理员账号。
- API Key 创建、一次性明文展示、查询与吊销。
- Resend 默认发件通道与发件人配置。
- 额外发件通道凭据保存；凭据使用 AES-256-GCM 加密后入库。
- 网站/域名绑定信息管理。
- 管理面板模版发信、邮件发送记录与失败原因。
- API Key 鉴权、请求体大小限制、数据库共享限流、Cloudflare 边缘限流与安全响应头。

> 当前默认邮件发送器使用 Netlify 环境变量中的 Resend 主通道。额外通道目前作为安全保存的配置项；在增加通道选择/切换逻辑前，不会自动作为备用通道或故障转移通道使用。

## 生产架构

- 应用仓库：https://github.com/Zhouzhou198871/mail
- Netlify 项目：qingtian-pay
- Netlify 源站：https://qingtian-pay.netlify.app
- 对外入口：https://mail.lynli.me
- Cloudflare Worker：mailhub-origin-proxy
- Cloudflare Worker Route：mail.lynli.me/*
- Worker 将请求转发至 Netlify 源站，并保留外部 Host / HTTPS 转发信息。

Cloudflare DNS：mail CNAME 指向 qingtian-pay.netlify.app，Cloudflare 代理已开启。不要将这个 Web 面板主机名与 SMTP/IMAP 邮件服务器主机名混用。

## 环境变量

在 Netlify 项目设置中配置。密钥应使用 Secret 环境变量，不要提交到 Git：

| 变量 | 必需 | 用途 |
|---|---:|---|
| NETLIFY_DB_URL | 是 | PostgreSQL 数据库连接 |
| NEXTAUTH_SECRET | 是 | NextAuth 会话签名密钥 |
| NEXTAUTH_URL | 是 | 固定为 https://mail.lynli.me |
| BOOTSTRAP_ADMIN_PASSWORD | 是 | 三个初始管理员的一次性初始化密码，至少 24 位 |
| PROVIDER_ENCRYPTION_KEY | 是 | 64 位十六进制 AES-256-GCM 加密密钥 |
| RESEND_API_KEY | 是 | Resend API Key |
| RESEND_FROM_EMAIL | 是 | Resend 已验证域名下的发件地址 |
| CF_API_TOKEN / CF_ACCOUNT_ID | 否 | 仅在应用需要执行 Cloudflare DNS 管理时使用 |
| DNSHE_API_ID / DNSHE_API_TOKEN | 否 | 可选 DNS 服务商凭据 |

本地环境：

~~~bash
cp .env.example .env
npm install
npm run dev
~~~

## 初始管理员

内置管理员邮箱：

- boss@lynli.me
- chulingli1988@outlook.com
- 2952974772@qq.com

首次部署时，系统从 Secret 环境变量 BOOTSTRAP_ADMIN_PASSWORD 初始化这三个账号。首次初始化完成后会写入数据库标记；后续部署不会覆盖管理员自行修改的密码。

管理员登录后可进入「个人中心」添加管理员、修改密码或删除其他管理员。不要删除唯一可用的管理员账号。

## 对接发信 API

请求：

~~~http
POST https://mail.lynli.me/api/v1/send
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
~~~

请求体：

~~~json
{
  "to": "recipient@example.com",
  "subject": "邮件主题",
  "html": "<p>邮件正文</p>"
}
~~~

成功响应：

~~~json
{
  "success": true,
  "id": "resend_message_id"
}
~~~

错误响应包含 success: false 与简短错误说明。触发限流时返回 HTTP 429，并带有 Retry-After 响应头。

安全要求：

- API Key 仅保存 SHA-256 哈希，明文只在创建时显示一次。
- 每个 API Key 默认每分钟最多发送 30 次；同一来源 IP 每分钟最多 120 次；未授权请求按 IP 每分钟最多 60 次。
- Cloudflare 对管理员登录回调每 10 秒最多允许 5 次，超过后短时封锁；应用数据库层再按账号与 IP 每 15 分钟最多 8 次。
- 单次请求体最多 256 KiB，HTML 正文最多 100 KiB。
- 不要把 API Key 放在浏览器前端代码、公开仓库或客户端应用中；应由业务网站服务端调用。
- 密钥泄露后立即在管理面板吊销并重新生成。

## 安全与反滥用

- Cloudflare 自定义规则对管理员登录页面与 credentials 登录回调启用 Managed Challenge。
- Cloudflare Rate Limiting 保护 credentials 登录回调。
- 管理员登录失败按账号与来源 IP 共享限流：每 15 分钟最多 8 次。
- API 发送按密钥和 IP 双重限流，数据保存在 PostgreSQL，跨 Netlify Function 实例生效。
- 未授权 API 发送尝试也会先按 IP 限流。
- 公开验证码发送接口已停用；本项目不开放公众注册。
- 管理 API 统一要求有效会话。
- 动态页面与 API 使用 no-store；响应添加 HSTS、X-Frame-Options、nosniff、Referrer-Policy 与 Permissions-Policy。
- 页面设置 noindex，避免管理面板被搜索引擎收录。
- 发件通道 API 凭据使用 AES-256-GCM 加密入库；旧版明文凭据会在设置页首次加载时迁移加密。
- Cloudflare Worker 不缓存管理页面、API 或认证响应。

## 发件域名与邮件送达

mail.lynli.me 是管理面板的 Web 入口，不等于发件域名。真正发信前，需在 Resend 验证专用发件域名，并按 Resend 控制台提供的值添加 SPF、DKIM 与 DMARC DNS 记录。不要猜测或复用未经验证的 DNS 值。

如果 RESEND_FROM_EMAIL 仍使用 onboarding@resend.dev，它只适合受限测试，不代表生产发件域名已经验证。

## 构建与部署

Netlify 连接 GitHub 的 main 分支后自动构建：

~~~bash
npm run build
~~~

构建包含 Prisma Client 生成、数据库结构同步与 Next.js 生产构建。部署后检查：

1. Netlify Published Deploy 状态为 Ready。
2. https://mail.lynli.me/login 可通过 HTTPS 打开。
3. 登录成功后进入 /dashboard，刷新后会话仍有效。
4. 未登录访问 /dashboard 或受保护 API 会被拒绝。
5. 创建 API Key 后用服务端请求调用 /api/v1/send。
6. 在「发件」页确认成功/失败记录。
7. 连续触发限流时应返回 HTTP 429。

## 常见问题

- **登录后跳回登录页**：检查 NEXTAUTH_URL 是否为 https://mail.lynli.me，并确认 Cloudflare Worker 转发了 x-forwarded-host 与 x-forwarded-proto。
- **页面打不开或 SSL 错误**：检查 mail.lynli.me 是否指向 qingtian-pay.netlify.app，DNS 是否开启代理，以及 Worker Route 是否存在。
- **登录失败**：检查 BOOTSTRAP_ADMIN_PASSWORD 是否配置；首次初始化后修改密码不会被后续部署覆盖。
- **API 返回 401**：检查 Authorization Bearer Key 是否完整、是否已吊销。
- **API 返回 429**：等待 Retry-After 指定时间后重试，并检查调用频率。
- **邮件发送失败**：检查 Resend API Key、发件地址是否属于已验证域名，以及 Resend 控制台的发送错误。
- **发件凭据保存失败**：检查 PROVIDER_ENCRYPTION_KEY 是否为 64 位十六进制字符串。

## 本地检查命令

~~~bash
npm run lint
npm run build
~~~

请勿将 .env、数据库连接串、API Key、管理员密码或 Cloudflare Token 提交到仓库。
