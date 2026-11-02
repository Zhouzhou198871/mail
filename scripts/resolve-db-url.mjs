/**
 * Resolve Postgres URL for Prisma from any of the names Netlify / Neon may inject.
 * Also tries @netlify/database getConnectionString() when available at build time.
 */
import { writeFileSync, existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

async function fromNetlifyDatabasePackage() {
  try {
    const mod = await import("@netlify/database");
    if (typeof mod.getConnectionString === "function") {
      const s = mod.getConnectionString();
      if (s && typeof s === "string" && s.length > 0) return s;
    }
  } catch {
    // package not installed or not on Netlify runtime
  }
  return null;
}

const fromEnv = [
  process.env.NETLIFY_DB_URL,
  process.env.NETLIFY_DATABASE_URL,
  process.env.DATABASE_URL,
  process.env.POSTGRES_URL,
  process.env.POSTGRES_PRISMA_URL,
  process.env.DATABASE_URL_UNPOOLED,
].filter((v) => typeof v === "string" && v.trim().length > 0);

let url = fromEnv[0] || null;
let source = fromEnv[0]
  ? process.env.NETLIFY_DB_URL
    ? "NETLIFY_DB_URL"
    : process.env.NETLIFY_DATABASE_URL
      ? "NETLIFY_DATABASE_URL"
      : process.env.DATABASE_URL
        ? "DATABASE_URL"
        : process.env.POSTGRES_URL
          ? "POSTGRES_URL"
          : process.env.POSTGRES_PRISMA_URL
            ? "POSTGRES_PRISMA_URL"
            : "DATABASE_URL_UNPOOLED"
  : null;

if (!url) {
  url = await fromNetlifyDatabasePackage();
  if (url) source = "@netlify/database getConnectionString()";
}

if (!url) {
  console.error(
    "[resolve-db-url] No database URL found.\n" +
      "Checked: NETLIFY_DB_URL, NETLIFY_DATABASE_URL, DATABASE_URL, POSTGRES_URL, POSTGRES_PRISMA_URL, DATABASE_URL_UNPOOLED, @netlify/database.\n" +
      "Open Netlify → Project → Data & Storage → Database and enable/claim a database, then redeploy."
  );
  process.exit(1);
}

process.env.DATABASE_URL = url;

const envPath = resolve(process.cwd(), ".env");
let existing = "";
if (existsSync(envPath)) {
  existing = readFileSync(envPath, "utf8")
    .split("\n")
    .filter((line) => !line.startsWith("DATABASE_URL="))
    .join("\n")
    .trim();
}
const escaped = url.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
const nextContent =
  (existing ? existing + "\n" : "") + `DATABASE_URL="${escaped}"\n`;
writeFileSync(envPath, nextContent, "utf8");

console.log(`[resolve-db-url] DATABASE_URL set from ${source}`);
