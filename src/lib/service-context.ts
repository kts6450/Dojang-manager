import type { UserRole } from "./rbac";
import { buildBranchFilter } from "./rbac";

export interface ServiceContext {
  userId: string;
  role: UserRole;
  branchId?: string | null;
  /** HQ_ADMIN can pass a selected branch to narrow results */
  selectedBranchId?: string | null;
}

/** Returns the MongoDB branchId filter appropriate for the current user */
export function branchScope(ctx: ServiceContext): Record<string, unknown> {
  return buildBranchFilter(ctx.role, ctx.branchId, ctx.selectedBranchId);
}
