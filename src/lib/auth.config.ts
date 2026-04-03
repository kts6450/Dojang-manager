import type { NextAuthConfig } from "next-auth";
import { isAdminRole } from "./rbac";

/**
 * Edge-compatible auth config (no mongoose/DB access)
 * Used in middleware.ts
 */
export const authConfig: NextAuthConfig = {
  providers: [],
  pages: {
    signIn: "/login",
  },
  cookies: {
    sessionToken: {
      name: "manager.session-token",
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: false },
    },
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
        token.branchId = (user as { branchId?: string | null }).branchId ?? null;
        token.belt = (user as { belt?: string }).belt;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as import("./rbac").UserRole;
        session.user.branchId = token.branchId as string | null;
        session.user.belt = token.belt as string;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = auth?.user?.role ?? "";
      const isLoginPage = nextUrl.pathname.startsWith("/login");
      const isPublicApi =
        nextUrl.pathname.startsWith("/api/auth") ||
        nextUrl.pathname.startsWith("/api/attendance/qr") ||
        nextUrl.pathname.startsWith("/api/seed") ||
        nextUrl.pathname.startsWith("/api/dev-reset");

      if (isPublicApi) return true;
      if (isLoginPage) {
        if (isLoggedIn && isAdminRole(role)) return Response.redirect(new URL("/", nextUrl));
        return true;
      }
      if (!isLoggedIn) return false;
      return true;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours
  },
};
