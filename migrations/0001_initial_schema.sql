PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "notificationEmail" TEXT,
  "receiveEmailAlerts" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Admin" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "BootstrapState" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "RateLimitBucket" (
  "key" TEXT PRIMARY KEY NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  "windowStart" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "RateLimitBucket_updatedAt_idx" ON "RateLimitBucket"("updatedAt");

CREATE TABLE IF NOT EXISTS "VerificationCode" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "email" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "expiresAt" TEXT NOT NULL,
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "VerificationCode_email_idx" ON "VerificationCode"("email");

CREATE TABLE IF NOT EXISTS "ApiKey" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "name" TEXT NOT NULL DEFAULT '默认密钥',
  "keyHash" TEXT NOT NULL UNIQUE,
  "keyPrefix" TEXT NOT NULL,
  "lastFour" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastUsedAt" TEXT,
  "status" TEXT NOT NULL DEFAULT 'active',
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "ApiKey_userId_idx" ON "ApiKey"("userId");
CREATE INDEX IF NOT EXISTS "ApiKey_keyHash_idx" ON "ApiKey"("keyHash");

CREATE TABLE IF NOT EXISTS "EmailLog" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "userId" TEXT NOT NULL,
  "to" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'panel',
  "siteName" TEXT,
  "resendId" TEXT,
  "error" TEXT,
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "EmailLog_userId_idx" ON "EmailLog"("userId");
CREATE INDEX IF NOT EXISTS "EmailLog_createdAt_idx" ON "EmailLog"("createdAt");
CREATE INDEX IF NOT EXISTS "EmailLog_source_idx" ON "EmailLog"("source");
CREATE INDEX IF NOT EXISTS "EmailLog_siteName_idx" ON "EmailLog"("siteName");

CREATE TABLE IF NOT EXISTS "SenderProvider" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'resend',
  "apiKey" TEXT NOT NULL,
  "fromEmail" TEXT NOT NULL,
  "note" TEXT,
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "SiteBinding" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "siteName" TEXT NOT NULL,
  "domain" TEXT NOT NULL,
  "providerId" TEXT,
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
