import type { NextAuthConfig } from "next-auth";

/**
 * Edge-compatible auth config (no mongoose/DB access)
 * Used in middleware.ts
 */
export const authConfig: NextAuthConfig = {
  providers: [],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isLoginPage = nextUrl.pathname.startsWith("/login");
      const isPublicApi =
        nextUrl.pathname.startsWith("/api/auth") ||
        nextUrl.pathname.startsWith("/api/attendance/qr") ||
        nextUrl.pathname.startsWith("/api/seed") ||
        nextUrl.pathname.startsWith("/api/dev-reset");

      if (isPublicApi) return true;
      if (isLoginPage) {
        if (isLoggedIn) return Response.redirect(new URL("/", nextUrl));
        return true;
      }
      if (!isLoggedIn) return false;
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
        token.belt = (user as { belt?: string }).belt;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.belt = token.belt as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
};
