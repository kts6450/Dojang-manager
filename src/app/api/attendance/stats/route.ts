import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import * as attendanceService from "@/services/attendance.service";
import type { ServiceContext } from "@/lib/service-context";
import type { UserRole } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const ctx: ServiceContext = {
      userId: session.user.id,
      role: session.user.role as UserRole,
      branchId: session.user.branchId,
      selectedBranchId: searchParams.get("branchId"),
    };
    const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : undefined;
    const month = searchParams.get("month") ? parseInt(searchParams.get("month")!) : undefined;

    const result = await attendanceService.getStats({ year, month }, ctx);
    return NextResponse.json(result);
  } catch (error) {
    logger.error("Failed to fetch attendance stats", { error: String(error) });
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}
