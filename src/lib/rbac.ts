export type UserRole = "HQ_ADMIN" | "BRANCH_ADMIN" | "MEMBER" | "STUDENT";

export const ADMIN_ROLES: UserRole[] = ["HQ_ADMIN", "BRANCH_ADMIN"];
export const MEMBER_ROLES: UserRole[] = ["MEMBER", "STUDENT"];

export function isAdminRole(role: string): role is "HQ_ADMIN" | "BRANCH_ADMIN" {
  return ADMIN_ROLES.includes(role as UserRole);
}

export function isHQ(role: string): role is "HQ_ADMIN" {
  return role === "HQ_ADMIN";
}

export function isBranchAdmin(role: string): role is "BRANCH_ADMIN" {
  return role === "BRANCH_ADMIN";
}

export function isMemberRole(role: string): role is "MEMBER" | "STUDENT" {
  return MEMBER_ROLES.includes(role as UserRole);
}

/** Builds the MongoDB branchId filter based on role and optional override from HQ selecting a branch */
export function buildBranchFilter(
  role: string,
  branchId?: string | null,
  selectedBranchId?: string | null
): Record<string, unknown> {
  // BRANCH_ADMIN: always scoped to their own branch
  if (role === "BRANCH_ADMIN" && branchId) {
    return { branchId };
  }
  // HQ_ADMIN: can optionally filter by a selected branch
  if (role === "HQ_ADMIN" && selectedBranchId) {
    return { branchId: selectedBranchId };
  }
  // HQ_ADMIN with no selection: sees everything
  return {};
}
