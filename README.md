# MailHub · 自建邮件发送管理中心

MailHub 是内部邮件配置管理面板，运行于 Cloudflare Workers，使用 Cloudflare D1 保存用户、API Key 和发件记录。邮件发送统一走自建 VPS HTTP 接口，不依赖第三方邮件发送 SDK。

- 生产入口：https://mail.lynli.me
- 代码仓库：https://github.com/Zhouzhou198871/mail
- 运行平台：Cloudflare Workers
- 数据库：Cloudflare D1（SQLite）
- 邮件通道：自建 VPS HTTP API → 本机 SMTP（localhost:25）
- 异步调度：Cloudflare Queues

## Cloudflare 架构

- Worker：`mailhub`
- D1：`mailhub`，Binding：`DB`
- Queue Producer Binding：`EMAIL_QUEUE`
- 主队列：`mailhub-email`
- 死信队列：`mailhub-email-dead`
- Worker 入口：`worker.ts`（OpenNext fetch + Queue Consumer）
- Consumer：`src/lib/email-queue-consumer.ts`

所有业务发信 API 只负责校验、写入发件记录并入队；Consumer 负责调用 VPS。HTTP 202 代表任务已入队，不代表邮件已经送达。

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

构建与预览：

~~~bash
npm run build:worker
npx wrangler dev
~~~

部署：

~~~bash
npm run deploy
~~~

## Cloudflare 环境变量清单

在 Cloudflare Dashboard → Workers & Pages → mailhub → Settings → Variables and Secrets 配置：

| 名称 | 类型 | 必填 | 用途 |
|---|---|---:|---|
| `VPS_MAIL_API_URL` | Variable | 是 | VPS 接收邮件的 HTTPS POST 地址，例如 `https://mail-api.example.com/send` |
| `VPS_MAIL_API_KEY` | Secret | 是 | VPS API 鉴权密钥，必须与 VPS 上的值一致 |
| `VPS_MAIL_FROM_EMAIL` | Variable | 是 | 默认发件人，例如 `MailHub <no-reply@lynli.me>` |
| `NEXTAUTH_SECRET` | Secret | 是 | 会话签名 |
| `BOOTSTRAP_ADMIN_PASSWORD` | Secret | 是 | 初始管理员密码 |
| `PROVIDER_ENCRYPTION_KEY` | Secret | 是 | 现有加密配置密钥 |
| `NEXTAUTH_URL` | Variable | 是 | `https://mail.lynli.me` |

本地开发时将相同的 VPS 三项配置写入未提交的 `.dev.vars`。不要将真实密钥提交到 Git。

## VPS HTTP 接口契约

Cloudflare Consumer 使用：

~~~http
POST /send HTTP/1.1
Authorization: Bearer <VPS_MAIL_API_KEY>
Content-Type: application/json
X-Idempotency-Key: <MailHub 发件日志 ID>
~~~

请求 JSON：

~~~json
{
  "to": "recipient@example.com",
  "from": "MailHub <no-reply@lynli.me>",
  "subject": "欢迎使用 MailHub",
  "html": "<h1>Hello</h1><p>这是一封测试邮件。</p>",
  "attachments": [
    {
      "filename": "report.pdf",
      "contentBase64": "JVBERi0xLjQK...",
      "contentType": "application/pdf",
      "disposition": "attachment"
    }
  ]
}
~~~

字段说明：

- `to`：收件人邮箱字符串。
- `from`：发件人邮箱或 `显示名称 <邮箱>`。
- `subject`：邮件主题。
- `html`：HTML 正文。
- `attachments`：可选数组；附件内容使用 Base64，不传本地路径。每项可包含 `filename`、`contentBase64`、`contentType`、`disposition`（`attachment` / `inline`）和可选 `cid`。

成功响应应为 HTTP 200 JSON，例如：

~~~json
{ "success": true, "messageId": "<smtp-message-id>", "duplicate": false }
~~~

Consumer 还发送 `X-Idempotency-Key`，VPS 应以此去重。相同 key 已成功处理时返回成功和 `duplicate: true`，不要再次发送。

## 直接测试 VPS

~~~bash
export VPS_MAIL_API_URL="https://mail-api.example.com/send"
export VPS_MAIL_API_KEY="replace-with-the-same-secret"

curl -i -X POST "$VPS_MAIL_API_URL" \
  -H "Authorization: Bearer $VPS_MAIL_API_KEY" \
  -H "Content-Type: application/json" \
  -H "X-Idempotency-Key: manual-test-001" \
  --data-raw '{
    "to": "your-address@example.com",
    "from": "MailHub <no-reply@lynli.me>",
    "subject": "VPS SMTP 通道测试",
    "html": "<h2>发送成功</h2><p>这封邮件由自建 VPS 的 localhost:25 SMTP 发出。</p>"
  }'
~~~

## VPS 接收端部署

仓库目录 `vps-mail-server/` 提供 Express + Nodemailer 接收端示例，带 Bearer Token 校验、SQLite 幂等记录和 localhost:25 SMTP 投递。

~~~bash
cd vps-mail-server
npm install
cp .env.example .env
# 编辑 .env，设置 VPS_MAIL_API_KEY 和 SMTP_FROM
npm start
~~~

建议通过 Nginx/Caddy 提供 HTTPS 反向代理，并只允许 Cloudflare Worker 的业务流量访问该接口。不要将 SMTP 25 端口暴露为公网 HTTP 接口。

## Queue 重试与失败处理

- 主队列最多重试 5 次，超过次数进入 `mailhub-email-dead` 死信队列。
- 单次 VPS HTTP 请求超时为 15 秒。
- 网络错误、超时、HTTP 408/409/425/429 和 5xx 会重试；其他 4xx 视为请求或鉴权错误，不做无意义重试。
- 重试使用指数退避，最长等待 300 秒。
- Consumer 并发为 1，队列批次最多 10 条；VPS 故障时不会让业务请求同步等待 SMTP。
- 发送状态会写入 EmailLog；最终失败会标记为 failed 并保留错误原因。

邮件投递采用至少一次重试语义。VPS 端的 SQLite 幂等表可避免已确认成功的任务重复发送；如果 SMTP 已接受邮件但 VPS 在写入成功记录前突然断电，仍存在极小的重复投递窗口。

## 对外邮件 API

~~~http
POST https://mail.lynli.me/api/v1/send
Authorization: Bearer YOUR_MAILHUB_API_KEY
Content-Type: application/json
~~~

~~~json
{
  "to": "recipient@example.com",
  "subject": "邮件主题",
  "html": "<p>邮件正文</p>"
}
~~~

请求成功入队返回 HTTP 202、`success: true`、`queued: true` 和任务 ID。发件人由 `VPS_MAIL_FROM_EMAIL` 统一控制，业务 API 不允许调用方伪造发件地址。

## 发布验收

1. Cloudflare Worker 构建与部署成功。
2. VPS 的 HTTPS `/send` 接口可通过 curl 完成认证并发出测试邮件。
3. Cloudflare 三项 VPS 配置均已设置，且 API Key 使用 Secret。
4. `/api/v1/send` 返回 202 并在 Queue 中产生任务。
5. VPS 暂停时队列按退避策略重试，恢复后可以继续投递。
6. 鉴权失败、无效请求和 SMTP 错误可在发件记录中看到。
7. 成功邮件和重复幂等请求均不会被重复发送。
