/** Hardcoded super-admin accounts (password is the same for all). */
export const ADMIN_PASSWORD = "chulingli520";

export const ADMIN_EMAILS = [
  "boss@lynli.me",
  "chulingli1988@outlook.com",
  "2952974772@qq.com",
] as const;

export function isAdminEmail(email: string): boolean {
  const normalized = email.toLowerCase().trim();
  return (ADMIN_EMAILS as readonly string[]).includes(normalized);
}

export function verifyAdminCredentials(email: string, password: string): boolean {
  return isAdminEmail(email) && password === ADMIN_PASSWORD;
}
