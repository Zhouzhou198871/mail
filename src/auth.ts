import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { verifyAdminLogin } from "@/lib/admins";
import { enforceRateLimit, getClientIp } from "@/lib/rate-limit";

const GITHUB_ADMIN_EMAILS = new Set([
  "2952974772@qq.com",
  "boss@lynli.me",
]);

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHub({
      clientId:
        process.env.AUTH_GITHUB_ID ||
        process.env.GITHUB_CLIENT_ID ||
        "",
      clientSecret:
        process.env.AUTH_GITHUB_SECRET ||
        process.env.GITHUB_CLIENT_SECRET ||
        "",
      authorization: {
        params: { scope: "read:user user:email" },
      },
      // Resolve the account's verified email even when the GitHub profile
      // keeps its public email private. Only verified addresses are trusted.
      profile: async (profile, tokens) => {
        let verifiedEmail: string | null = null;

        if (tokens.access_token) {
          try {
            const response = await fetch("https://api.github.com/user/emails", {
              headers: {
                Authorization: `Bearer ${tokens.access_token}`,
                Accept: "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
              },
            });

            if (response.ok) {
              const emails = (await response.json()) as Array<{
                email: string;
                primary: boolean;
                verified: boolean;
              }>;
              verifiedEmail =
                emails.find((item) => item.primary && item.verified)?.email ??
                emails.find((item) => item.verified)?.email ??
                null;
            }
          } catch {
            verifiedEmail = null;
          }
        }

        return {
          id: String(profile.id),
          name: profile.name ?? profile.login,
          email: verifiedEmail,
          image: profile.avatar_url,
        };
      },
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = String(credentials.email).toLowerCase().trim();
        const password = String(credentials.password);
        const ip = getClientIp(request);
        const allowed = await enforceRateLimit(
          "admin-login:" + email + ":" + ip,
          8,
          15 * 60 * 1000
        );
        if (!allowed) return null;

        const admin = await verifyAdminLogin(email, password);
        if (!admin) return null;
        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) user = await prisma.user.create({ data: { email } });
        return { id: user.id, email: user.email };
      },
    }),
  ],
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "github") return true;

      const email = user.email?.toLowerCase().trim();
      if (!email || !GITHUB_ADMIN_EMAILS.has(email)) return false;

      // The admin gate used by MailHub and the payment bridge checks this
      // table after authentication. Create the allowlisted admin on first
      // verified GitHub sign-in without replacing an existing password.
      await prisma.admin.upsert({
        where: { email },
        create: {
          email,
          passwordHash: hashPassword(crypto.randomUUID()),
        },
        update: {},
      });

      return true;
    },
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) session.user.id = token.id as string;
      return session;
    },
  },
  trustHost: true,
});
