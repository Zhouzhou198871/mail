import { auth } from "@/auth";
import { NextResponse } from "next/server";

function applySecurityHeaders(response: NextResponse, pathname: string) {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Strict-Transport-Security", "max-age=31536000");
  response.headers.set("X-DNS-Prefetch-Control", "off");
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin") || pathname.startsWith("/api/")) {
    response.headers.set("Cache-Control", "no-store, max-age=0");
    response.headers.set("Pragma", "no-cache");
  }
  return response;
}

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;
  const isProtectedPage = pathname.startsWith("/dashboard") || pathname.startsWith("/admin");
  const isProtectedApi =
    pathname.startsWith("/api/dashboard") ||
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/api/keys") ||
    pathname.startsWith("/api/settings") ||
    pathname.startsWith("/api/user");

  if ((isProtectedPage || isProtectedApi) && !isLoggedIn) {
    if (isProtectedApi) {
      return applySecurityHeaders(
        NextResponse.json({ error: "未登录" }, { status: 401 }),
        pathname
      );
    }
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return applySecurityHeaders(NextResponse.redirect(loginUrl), pathname);
  }
  return applySecurityHeaders(NextResponse.next(), pathname);
});

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
