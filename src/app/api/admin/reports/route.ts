import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connect";
import User from "@/lib/db/models/User";
import Attendance from "@/lib/db/models/Attendance";
import Tuition from "@/lib/db/models/Tuition";
import Branch from "@/lib/db/models/Branch";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "HQ_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const filterBranchId = searchParams.get("branchId") || null;

    await connectDB();

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const branches = await Branch.find({ status: "active" }).lean();
    const targetBranches = filterBranchId
      ? branches.filter((b) => b._id.toString() === filterBranchId)
      : branches;

    const stats = await Promise.all(
      targetBranches.map(async (branch) => {
        const branchId = branch._id;
        const [memberCount, attendanceCount, tuitionAgg] = await Promise.all([
          User.countDocuments({ branchId, status: "active", role: { $in: ["MEMBER", "STUDENT"] } }),
          Attendance.countDocuments({ branchId, date: { $gte: monthStart, $lte: monthEnd } }),
          Tuition.aggregate([
            { $match: { branchId } },
            { $group: { _id: "$status", count: { $sum: 1 }, total: { $sum: "$amount" } } },
          ]),
        ]);

        const revenue = tuitionAgg.find((a) => a._id === "paid")?.total ?? 0;
        const overdueCount = tuitionAgg.find((a) => a._id === "overdue")?.count ?? 0;

        return {
          branchId: branchId.toString(),
          branchName: branch.name,
          memberCount,
          attendanceCount,
          revenue,
          overdueCount,
        };
      })
    );

    // Monthly trend (last 6 months) — across all or selected branch
    const branchFilter = filterBranchId ? { branchId: filterBranchId } : {};
    const monthlyRevenue = await Tuition.aggregate([
      { $match: { status: "paid", ...branchFilter } },
      { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$paidAt" } }, revenue: { $sum: "$amount" } } },
      { $sort: { _id: 1 } },
      { $limit: 6 },
    ]);
    const monthlyAttendance = await Attendance.aggregate([
      { $match: branchFilter },
      { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$date" } }, attendance: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $limit: 6 },
    ]);

    // Merge monthly data
    const monthMap: Record<string, { month: string; revenue: number; attendance: number }> = {};
    for (const m of monthlyRevenue) {
      monthMap[m._id] = { month: m._id, revenue: m.revenue, attendance: 0 };
    }
    for (const m of monthlyAttendance) {
      if (monthMap[m._id]) {
        monthMap[m._id].attendance = m.attendance;
      } else {
        monthMap[m._id] = { month: m._id, revenue: 0, attendance: m.attendance };
      }
    }
    const monthly = Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month));

    const totals = stats.reduce(
      (acc, s) => ({
        members: acc.members + s.memberCount,
        attendance: acc.attendance + s.attendanceCount,
        revenue: acc.revenue + s.revenue,
        overdue: acc.overdue + s.overdueCount,
      }),
      { members: 0, attendance: 0, revenue: 0, overdue: 0 }
    );

    return NextResponse.json({ stats, totals, monthly });
  } catch (error) {
    logger.error("Failed to generate HQ report", { error: String(error) });
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
