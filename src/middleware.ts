import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";
import { isAdminRole } from "@/lib/rbac";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth?.user;
  const role = req.auth?.user?.role ?? "";
  const { nextUrl } = req;

  const isLoginPage = nextUrl.pathname.startsWith("/login");
  const isPublicApi =
    nextUrl.pathname.startsWith("/api/auth") ||
    nextUrl.pathname.startsWith("/api/attendance/qr") ||
    nextUrl.pathname.startsWith("/api/seed") ||
    nextUrl.pathname.startsWith("/api/dev-reset");
  const isPublicAsset =
    nextUrl.pathname.startsWith("/_next") ||
    nextUrl.pathname === "/favicon.ico";

  if (isPublicApi || isPublicAsset) return NextResponse.next();

  if (isLoginPage) {
    if (isLoggedIn && isAdminRole(role)) {
      return NextResponse.redirect(new URL("/", nextUrl));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl);
    const callbackUrl = `${nextUrl.pathname}${nextUrl.search}`;
    if (callbackUrl && callbackUrl !== "/") {
      loginUrl.searchParams.set("callbackUrl", callbackUrl);
    }
    return NextResponse.redirect(loginUrl);
  }

  // Block MEMBER/STUDENT from accessing the admin portal
  if (!isAdminRole(role)) {
    return NextResponse.redirect(new URL("/login?error=admin_only", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
