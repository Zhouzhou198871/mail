# MailHub · 邮件配置管理中心

MailHub 是内部邮件配置管理面板，不是公共邮箱平台，也不开放公众注册。管理员在这里维护邮件发送配置、生成 API Key，供其他网站或系统通过服务端 API 调用。

- 生产入口：https://mail.lynli.me
- 代码仓库：https://github.com/Zhouzhou198871/mail
- 运行平台：Cloudflare Workers
- 数据库：Cloudflare D1（SQLite）
- 邮件通道：Resend 主通道 + SendGrid 备用通道
- 异步调度：Cloudflare Queues

## 功能

- 三个初始管理员登录；管理员可在面板创建、管理其他账号。
- API Key 创建、一次性明文展示、查询与吊销。
- Resend 默认发件通道与发件人配置。
- 额外发件通道凭据加密保存（AES-256-GCM）。
- 网站/域名绑定信息管理。
- 模版邮件测试、发送记录与失败原因。
- API Key 鉴权、数据库共享限流、Cloudflare 边缘防护与安全响应头。

## Cloudflare 架构

- Worker 名称：\`mailhub\`
- D1 数据库：\`mailhub\`
- D1 Binding：\`DB\`
- 对外域名：\`mail.lynli.me\`
- Worker 配置：\`wrangler.jsonc\`
- Worker 入口：\`worker.ts\`（包装 OpenNext fetch，并处理 Queue Consumer）
- Queue Producer Binding：\`EMAIL_QUEUE\`
- 主队列：\`mailhub-email\`
- 死信队列：\`mailhub-email-dead\`
- SQL 迁移：\`migrations/\`

\`mail.lynli.me\` 是管理面板 Web 域名，不是 SMTP/IMAP 邮件主机名。

## 本地开发

需要 Node.js 20+。

~~~bash
npm install
cp .dev.vars.example .dev.vars
npm run dev
~~~

本地 D1：

~~~bash
npx wrangler d1 migrations apply mailhub --local
~~~

生产 D1：

~~~bash
npx wrangler d1 migrations apply mailhub --remote
~~~

构建与本地 Worker 预览：

~~~bash
npm run build:worker
npx wrangler dev
~~~

部署：

~~~bash
npm run deploy
~~~

## Cloudflare Workers Builds

Cloudflare Workers Builds 使用 GitHub main 分支自动构建：

- Build command：\`npm run build:worker\`
- Deploy command：\`npx opennextjs-cloudflare deploy\`
- Build-time variable：\`DATABASE_URL=file:./dev.db\`
- Wrangler 配置文件：\`wrangler.jsonc\`

运行时密钥必须配置在 Worker 的 Settings → Variables and Secrets（Secret），不要放在构建变量或 Git 仓库：

| Secret | 用途 |
|---|---|
| \`NEXTAUTH_SECRET\` | 会话签名 |
| \`BOOTSTRAP_ADMIN_PASSWORD\` | 三个初始管理员首次初始化密码（至少 24 位） |
| \`PROVIDER_ENCRYPTION_KEY\` | AES-256-GCM 密钥（64 位十六进制） |
| \`RESEND_API_KEY\` | Resend API Key |
| \`RESEND_FROM_EMAIL\` | 已验证发件域名的发件地址 |
| \`SENDGRID_API_KEY\` | SendGrid 备用 API Key（可选） |
| \`SENDGRID_FROM_EMAIL\` | SendGrid 已验证发件地址（可选） |

\`NEXTAUTH_URL\` 可作为普通运行时变量，固定为 \`https://mail.lynli.me\`。

## 初始管理员

初始管理员邮箱：

- boss@lynli.me
- chulingli1988@outlook.com
- 2952974772@qq.com

首次初始化读取 \`BOOTSTRAP_ADMIN_PASSWORD\`。初始化使用幂等 upsert，不会覆盖已经存在的管理员密码。D1 不支持 Prisma 交互式事务，因此初始化流程按可重试、不可覆盖现有密码的方式执行。

## 对接邮件发送 API

~~~http
POST https://mail.lynli.me/api/v1/send
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
~~~

~~~json
{
  "to": "recipient@example.com",
  "subject": "邮件主题",
  "html": "<p>邮件正文</p>"
}
~~~

请求通过鉴权后会推入 Cloudflare Queues，立即返回 HTTP \`202 Accepted\`、\`success: true\`、\`queued: true\` 和 MailHub 任务 ID。202 仅表示任务入队，不代表已经送达；最终状态在发件记录中查看。

安全规则：

- API Key 只保存 SHA-256 哈希，明文只在创建时显示一次。
- 每个 API Key 每分钟最多 600 次；同一来源 IP 每分钟最多 1200 次。
- 未授权发送尝试按 IP 每分钟最多 60 次。
- 单次请求体最多 256 KiB，HTML 正文最多 100 KiB。
- 不要把 API Key 放入浏览器代码或客户端；由业务系统服务端调用。
- 密钥泄露后立即吊销并重新生成。

## Queue 重试与吞吐控制

- 主队列 \`mailhub-email\`，最大重试 5 次，指数退避，失败后进入 \`mailhub-email-dead\` 死信队列。
- Consumer 最大并发 1、每批最多 10 封，并在发送间隔增加 125ms，目标控制在当前 Resend 账户 10 req/s 限速以下。队列用于削峰，不会绕过供应商速率限制。
- Resend 使用发件日志 ID 作为 \`Idempotency-Key\`，降低重试重复投递风险。
- SendGrid 仅在 Resend 返回明确永久性 4xx 错误时作为备用；网络不确定、429 和 5xx 会优先重试 Resend。SendGrid 不提供同等原生幂等保证。

## 邮件送达配置

发件域名需要在 Resend 控制台验证，并按 Resend 提供的 DNS 值配置 SPF、DKIM、DMARC。不要猜测 DNS 记录。管理面板的 \`mail.lynli.me\` 不会自动成为发件域名。

## 数据迁移说明

D1 已创建并包含应用表结构。正式切换前必须从原数据库导出并导入管理员、用户、API Key、发件通道、站点绑定和发件记录；导入前应核对条数与关联关系。不要在数据迁移和 Cloudflare 生产验收完成前删除原 Netlify 项目或原数据库。

## 发布验收清单

1. Cloudflare Worker 构建和部署成功。
2. \`mail.lynli.me/login\` 通过 HTTPS 打开。
3. 三个初始管理员可登录，管理员新增账号可持久化。
4. 页面刷新后登录状态正常。
5. 未登录访问管理 API 返回 401。
6. API Key 创建、调用、吊销正常。
7. Resend 测试邮件成功，并在发件记录中留痕。
8. 错误请求、超大请求和高频请求得到正确拒绝。
9. D1 数据行数与原数据库核对完成后，才切换域名并退役旧平台。
