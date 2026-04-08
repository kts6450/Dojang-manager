import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import * as inventoryService from "@/services/inventory.service";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get("limit");
    const skip = searchParams.get("skip");

    const result = await inventoryService.listItemLogs(id, {
      limit: limit ? parseInt(limit, 10) : undefined,
      skip: skip ? parseInt(skip, 10) : undefined,
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && "statusCode" in error) {
      return NextResponse.json({ error: error.message }, { status: (error as Record<string, unknown>).statusCode as number });
    }
    logger.error("Failed to list inventory logs", { error: String(error) });
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}
