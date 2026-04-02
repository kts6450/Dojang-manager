import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";
import { logger } from "@/lib/logger";
import { getYearlyReport } from "@/services/report.service";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const year = parseInt(
      req.nextUrl.searchParams.get("year") || String(new Date().getFullYear()),
    );

    const report = await getYearlyReport(year);
    return NextResponse.json(report);
  } catch (error) {
    logger.error("Failed to get yearly report", { error: String(error) });
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}
