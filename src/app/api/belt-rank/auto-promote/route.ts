import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import * as beltRankService from "@/services/belt-rank.service";

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const result = await beltRankService.getEligibleMembers();
    return NextResponse.json(result);
  } catch (error) {
    logger.error("Failed to fetch eligible members", { error: String(error) });
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { memberId } = await req.json();
    if (!memberId) return NextResponse.json({ error: "Member ID is required." }, { status: 400 });

    const result = await beltRankService.promoteMembers(memberId, session.user?.name ?? undefined);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && "statusCode" in error) {
      return NextResponse.json(
        { error: error.message },
        { status: (error as Record<string, unknown>).statusCode as number },
      );
    }
    logger.error("Failed to promote member", { error: String(error) });
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}
