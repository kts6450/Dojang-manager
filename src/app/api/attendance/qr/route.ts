import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import * as attendanceService from "@/services/attendance.service";

export async function POST(req: NextRequest) {
  try {
    const { memberId, classType } = await req.json();
    if (!memberId) {
      return NextResponse.json({ error: "Member ID is required." }, { status: 400 });
    }

    const result = await attendanceService.qrCheckIn(memberId, classType);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && "statusCode" in error) {
      return NextResponse.json(
        { error: error.message },
        { status: (error as Record<string, unknown>).statusCode as number },
      );
    }
    logger.error("QR check-in failed", { error: String(error) });
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}
