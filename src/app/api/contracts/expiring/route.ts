import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connect";
import Contract from "@/lib/db/models/Contract";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") ?? "30", 10);

    const now = new Date();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + days);

    const filter: Record<string, unknown> = {
      status: "signed",
      endDate: { $gte: now, $lte: cutoff },
    };

    // Scope by branch
    const role = session.user.role;
    const branchId = session.user.branchId;
    if (role === "BRANCH_ADMIN" && branchId) {
      filter.branchId = branchId;
    }

    // HQ_ADMIN: optional branchId filter via query param
    const qBranch = searchParams.get("branchId");
    if (role === "HQ_ADMIN" && qBranch && qBranch !== "all") {
      filter.branchId = qBranch;
    }

    const contracts = await Contract.find(filter)
      .populate("userId", "name phone belt")
      .populate("branchId", "name")
      .sort({ endDate: 1 })
      .lean();

    const data = contracts.map((c) => {
      const daysLeft = Math.ceil(
        (new Date(c.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      return { ...c, daysLeft };
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Expiring contracts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
