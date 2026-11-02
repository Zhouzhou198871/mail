/**
 * Ensure NETLIFY_DB_URL is available for Prisma.
 * Prefer Netlify-injected vars, then fall back to other common names / package helper.
 */
import { writeFileSync, existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

async function fromNetlifyDatabasePackage() {
  try {
    const mod = await import("@netlify/database");
    if (typeof mod.getConnectionString === "function") {
      const s = mod.getConnectionString();
      if (s && typeof s === "string" && s.trim().length > 0) return s.trim();
    }
  } catch {
    // not available outside Netlify / package missing
  }
  return null;
}

const candidates = [
  ["NETLIFY_DB_URL", process.env.NETLIFY_DB_URL],
  ["NETLIFY_DATABASE_URL", process.env.NETLIFY_DATABASE_URL],
  ["DATABASE_URL", process.env.DATABASE_URL],
  ["POSTGRES_URL", process.env.POSTGRES_URL],
  ["POSTGRES_PRISMA_URL", process.env.POSTGRES_PRISMA_URL],
  ["DATABASE_URL_UNPOOLED", process.env.DATABASE_URL_UNPOOLED],
];

let url = null;
let source = null;
for (const [name, value] of candidates) {
  if (typeof value === "string" && value.trim().length > 0) {
    url = value.trim();
    source = name;
    break;
  }
}

if (!url) {
  url = await fromNetlifyDatabasePackage();
  if (url) source = "@netlify/database getConnectionString()";
}

if (!url) {
  console.error(
    "[resolve-db-url] No database URL found.\n" +
      "Checked NETLIFY_DB_URL, NETLIFY_DATABASE_URL, DATABASE_URL, POSTGRES_URL, and @netlify/database."
  );
  process.exit(1);
}

process.env.NETLIFY_DB_URL = url;
process.env.DATABASE_URL = url;

const envPath = resolve(process.cwd(), ".env");
let lines = [];
if (existsSync(envPath)) {
  lines = readFileSync(envPath, "utf8")
    .split("\n")
    .filter(
      (line) =>
        !line.startsWith("NETLIFY_DB_URL=") && !line.startsWith("DATABASE_URL=")
    );
}
const escaped = url.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
lines.push(`NETLIFY_DB_URL="${escaped}"`);
lines.push(`DATABASE_URL="${escaped}"`);
writeFileSync(envPath, lines.filter(Boolean).join("\n") + "\n", "utf8");

console.log(`[resolve-db-url] NETLIFY_DB_URL set from ${source}`);
