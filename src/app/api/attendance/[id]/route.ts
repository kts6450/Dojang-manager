import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import * as attendanceService from "@/services/attendance.service";
import type { Session } from "next-auth";
import type { ServiceContext } from "@/lib/service-context";
import type { UserRole } from "@/lib/rbac";

function buildCtx(session: Session): ServiceContext {
  return {
    userId: session.user.id,
    role: session.user.role as UserRole,
    branchId: session.user.branchId,
  };
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const record = await attendanceService.updateAttendance(id, body, buildCtx(session!));
    return NextResponse.json(record);
  } catch (error) {
    if (error instanceof Error && "statusCode" in error) {
      return NextResponse.json({ error: error.message }, { status: (error as Record<string, unknown>).statusCode as number });
    }
    logger.error("Failed to update attendance", { error: String(error) });
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const result = await attendanceService.deleteAttendance(id, buildCtx(session!));
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && "statusCode" in error) {
      return NextResponse.json({ error: error.message }, { status: (error as Record<string, unknown>).statusCode as number });
    }
    logger.error("Failed to delete attendance", { error: String(error) });
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}
