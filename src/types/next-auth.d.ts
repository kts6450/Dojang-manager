import "next-auth";
import type { UserRole } from "@/lib/rbac";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: UserRole;
      branchId?: string | null;
      belt?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    branchId?: string | null;
    belt?: string;
  }
}
