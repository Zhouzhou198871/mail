# Self-hosted Mail Platform Migration

## Non-negotiable requirements

- Remove Resend as a runtime dependency and do not use a third-party email sending API.
- Keep the existing production deployment and database untouched until migration is tested and explicitly approved.
- Mail server handles SMTP ingress/egress, spam checks and a bounded retry queue; it is not the long-term mailbox/archive store.
- Archive raw message bodies and attachments in the configured object store; keep searchable metadata, tenant settings, conversation state and delivery status in the application database.
- Use Zhipu GLM only for AI tasks: inbound classification, contextual reply drafting, missing-information questions, human-assist drafts and HTML template generation.
- Never send an AI-generated reply automatically for sensitive/account/payment/security topics; route these to human review by default.
- Support multiple sites/tenants with isolated sender identities, domains, templates, API keys, quotas and audit logs.

## Target topology

1. Mail transport: Stalwart on the dedicated mail host, with persistent queue/spool only and strict queue retention/size limits.
2. Application/API: existing MailHub application, extended with a transport adapter that submits to the self-hosted SMTP service. No Resend SDK or Resend secrets in the target runtime.
3. Object archive: Alibaba Cloud OSS for MIME source, rendered HTML and attachments. Access via server-side credentials only; private bucket, encryption and lifecycle rules.
4. Metadata: Firestore is the proposed metadata/conversation store only after credentials, region, quotas and access path are verified. Do not assume Firestore and OSS have free cross-cloud transfer.
5. AI: Zhipu API key stored as a server secret. Never expose it to browser code, logs or repository files.
6. Admin UI: retain the current web app as a separate management surface; responsive desktop/mobile; no admin UI installation on the mail host.

## Delivery safety

- Use a durable outbox with idempotency keys. A retry must not create duplicate sends.
- Persist state transitions: accepted, queued, sending, sent, deferred, bounced, failed, needs_human.
- Keep raw MIME and attachments in object storage; keep a short-lived encrypted local spool only while delivery is pending.
- Enforce tenant-level rate limits, per-domain quotas, sender authorization and audit logs.
- Verify SPF, DKIM, DMARC, PTR/rDNS, inbound/outbound TCP 25, TLS and provider abuse policies before enabling production delivery.
- Do not route through the legacy Aliyun SMTP credentials, Resend, or any third-party send API.
- Do not modify the existing payment, crawler or shop services on 8.210.61.146.

## Staged rollout

1. Inventory existing MailHub routes, auth, D1 schema, domains and current production bindings. Preserve the production state.
2. Implement provider-neutral mail domain model, tenant isolation, outbox and audit trail.
3. Add Stalwart SMTP adapter and inbound webhook/LMTP ingestion path; add OSS archive adapter and metadata adapter.
4. Add Zhipu workflow with human approval gates and prompt/version audit.
5. Add local integration tests using a disposable SMTP sink; verify retries, duplicate suppression, attachment handling and tenant isolation.
6. Deploy to a separate test hostname and test server. Validate DNS and deliverability before production cutover.
7. Cut over only after backup, data reconciliation, acceptance tests and explicit approval.

## Current blockers to production deployment

- SSH/console execution access to the selected mail host is not connected to this workspace.
- Confirm actual server RAM/disk and whether inbound/outbound TCP 25 is permitted.
- Confirm OSS bucket region/credentials and Firestore project access from the application runtime.
- Confirm the sending domain(s) and DNS control for SPF, DKIM, DMARC and PTR.

No production deployment or DNS change is authorized by this document.
