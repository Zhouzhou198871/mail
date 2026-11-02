/**
 * Netlify may inject the Postgres URL under different names depending on
 * which database product/extension is enabled:
 *   - NETLIFY_DB_URL          (current Netlify Database)
 *   - NETLIFY_DATABASE_URL    (legacy Netlify DB / Neon extension)
 *   - DATABASE_URL            (manual / Neon / Supabase)
 *
 * Prisma only reads DATABASE_URL from the schema, so we normalize here
 * before `prisma db push` / runtime.
 */
import { writeFileSync, existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const candidates = [
  process.env.NETLIFY_DB_URL,
  process.env.NETLIFY_DATABASE_URL,
  process.env.DATABASE_URL,
].filter((v) => typeof v === "string" && v.length > 0);

if (candidates.length === 0) {
  console.error(
    "[resolve-db-url] No database URL found. Checked NETLIFY_DB_URL, NETLIFY_DATABASE_URL, DATABASE_URL."
  );
  console.error(
    "[resolve-db-url] Enable Netlify Database (Data & Storage → Database) or set one of those env vars."
  );
  process.exit(1);
}

const url = candidates[0];
process.env.DATABASE_URL = url;

// Persist for subsequent prisma CLI invocations in the same build step chain.
// Netlify build runs each npm script segment in the same shell when using &&,
// but writing a tiny dotenv file is the most reliable cross-step handoff.
const envPath = resolve(process.cwd(), ".env");
let existing = "";
if (existsSync(envPath)) {
  existing = readFileSync(envPath, "utf8");
  // strip old DATABASE_URL lines
  existing = existing
    .split("\n")
    .filter((line) => !line.startsWith("DATABASE_URL="))
    .join("\n")
    .trim();
}
const nextContent =
  (existing ? existing + "\n" : "") + `DATABASE_URL="${url.replace(/"/g, "\\\"")}"\n`;
writeFileSync(envPath, nextContent, "utf8");

console.log(
  `[resolve-db-url] Using database URL from ${
    process.env.NETLIFY_DB_URL
      ? "NETLIFY_DB_URL"
      : process.env.NETLIFY_DATABASE_URL
        ? "NETLIFY_DATABASE_URL"
        : "DATABASE_URL"
  }`
);
