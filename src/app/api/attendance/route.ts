import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ZodError } from "zod";
import { logger } from "@/lib/logger";
import { attendanceCreateSchema } from "@/lib/validations/attendance";
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

    const result = await attendanceService.listAttendance({
      userId: searchParams.get("userId") || undefined,
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      status: searchParams.get("status") || undefined,
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "50"),
    }, ctx);
    return NextResponse.json(result);
  } catch (error) {
    logger.error("Failed to list attendance", { error: String(error) });
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const ctx: ServiceContext = {
      userId: session.user.id,
      role: session.user.role as UserRole,
      branchId: session.user.branchId,
    };

    const body = attendanceCreateSchema.parse(await req.json());
    const result = await attendanceService.createAttendance(body, ctx);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    if (error instanceof Error && "statusCode" in error) {
      return NextResponse.json({ error: error.message }, { status: (error as Record<string, unknown>).statusCode as number });
    }
    logger.error("Failed to create attendance", { error: String(error) });
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}
