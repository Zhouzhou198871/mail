# MailHub VPS Mail API

Express + Nodemailer receiver for Cloudflare Queue Consumer. It authenticates Bearer tokens, accepts JSON mail jobs, sends through the local SMTP daemon at `127.0.0.1:25`, and stores idempotency keys in SQLite.

## Install

Node.js 20+ is recommended. Ensure a local MTA (Postfix/Exim) is listening on loopback port 25 and can relay mail for your sender domain.

~~~bash
cd vps-mail-server
npm install
cp .env.example .env
# Set VPS_MAIL_API_KEY to the same long random value as Cloudflare.
npm start
~~~

The example binds to `127.0.0.1:8787`. Put Nginx or Caddy in front of it to expose an HTTPS URL such as `https://mail-api.example.com/send`. Keep port 8787 private; do not expose it directly to the internet.

## Test

~~~bash
export VPS_MAIL_API_URL="https://mail-api.example.com/send"
export VPS_MAIL_API_KEY="your-long-secret"

curl -i -X POST "$VPS_MAIL_API_URL" \
  -H "Authorization: Bearer $VPS_MAIL_API_KEY" \
  -H "Content-Type: application/json" \
  -H "X-Idempotency-Key: smoke-test-001" \
  --data-raw '{
    "to": "you@example.com",
    "from": "MailHub <no-reply@lynli.me>",
    "subject": "Self-hosted mail test",
    "html": "<h1>It works</h1><p>Sent via localhost:25</p>"
  }'
~~~

A repeated request with the same `X-Idempotency-Key` returns `duplicate: true` after the first successful SMTP acceptance and is not sent again.

## Attachments

`attachments` is optional. Each item requires a Base64 payload:

~~~json
{
  "filename": "report.pdf",
  "contentBase64": "JVBERi0xLjQK...",
  "contentType": "application/pdf",
  "disposition": "attachment"
}
~~~

Up to 10 attachments are accepted by this example. Keep the complete Cloudflare queue message below 120 KiB.

## Environment

- `VPS_MAIL_API_KEY`: shared secret, required.
- `SMTP_HOST`: defaults to `127.0.0.1`.
- `SMTP_PORT`: defaults to `25`.
- `SMTP_FROM`: fallback sender address.
- `IDEMPOTENCY_DB`: SQLite file path.
- `HOST` / `PORT`: API bind address, defaults to `127.0.0.1:8787`.

The SMTP daemon must be configured separately to relay for the sender domain and should have SPF, DKIM and DMARC configured. This API does not configure DNS or an MTA for you.
