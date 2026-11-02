import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { verifyAdminLogin } from "@/lib/admins";
import { enforceRateLimit, getClientIp } from "@/lib/rate-limit";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
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
