import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connect";
import User from "@/lib/db/models/User";
import Attendance from "@/lib/db/models/Attendance";
import Tuition from "@/lib/db/models/Tuition";
import Contract from "@/lib/db/models/Contract";
import Branch from "@/lib/db/models/Branch";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "HQ_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const todayEnd   = new Date(now); todayEnd.setHours(23, 59, 59, 999);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const weekStart  = new Date(now); weekStart.setDate(now.getDate() - 6); weekStart.setHours(0,0,0,0);
    const in7Days    = new Date(now); in7Days.setDate(now.getDate() + 7);

    const branches = await Branch.find({ status: "active" }).lean();

    // Per-branch KPIs
    const branchStats = await Promise.all(
      branches.map(async (branch) => {
        const bId = branch._id;
        const [members, todayAttendance, monthRevAgg, overdueCount, newToday] = await Promise.all([
          User.countDocuments({ branchId: bId, role: { $in: ["MEMBER", "STUDENT"] }, status: "active" }),
          Attendance.countDocuments({ branchId: bId, date: { $gte: todayStart, $lte: todayEnd } }),
          Tuition.aggregate([
            { $match: { branchId: bId, status: "paid", paidAt: { $gte: monthStart } } },
            { $group: { _id: null, total: { $sum: "$amount" } } },
          ]),
          Tuition.countDocuments({ branchId: bId, status: "overdue" }),
          User.countDocuments({ branchId: bId, role: { $in: ["MEMBER","STUDENT"] }, joinedAt: { $gte: todayStart } }),
        ]);

        const monthRevenue = monthRevAgg[0]?.total ?? 0;

        return {
          branchId: bId.toString(),
          branchName: branch.name,
          branchCode: branch.code,
          members,
          todayAttendance,
          monthRevenue,
          overdueCount,
          newToday,
        };
      })
    );

    // Total KPIs (sum)
    const totals = branchStats.reduce(
      (acc, s) => ({
        members:       acc.members + s.members,
        todayAttendance: acc.todayAttendance + s.todayAttendance,
        monthRevenue:  acc.monthRevenue + s.monthRevenue,
        overdueCount:  acc.overdueCount + s.overdueCount,
        newToday:      acc.newToday + s.newToday,
      }),
      { members: 0, todayAttendance: 0, monthRevenue: 0, overdueCount: 0, newToday: 0 }
    );

    // Branch rankings
    const byRevenue    = [...branchStats].sort((a, b) => b.monthRevenue - a.monthRevenue);
    const byAttendance = [...branchStats].sort((a, b) => b.todayAttendance - a.todayAttendance);

    // Expiring contracts (all branches, within 7 days)
    const expiringContracts = await Contract.find({
      endDate: { $gte: now, $lte: in7Days },
    })
      .populate("userId", "name")
      .limit(5)
      .lean();

    // Weekly check-in trend (last 7 days, all branches)
    const weeklyRaw = await Attendance.aggregate([
      { $match: { date: { $gte: weekStart, $lte: todayEnd } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart); d.setDate(weekStart.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      const found = weeklyRaw.find((r) => r._id === key);
      return { date: key, label: d.toLocaleDateString("en-US", { weekday: "short" }), count: found?.count ?? 0 };
    });

    return NextResponse.json({
      totals,
      branchStats,
      rankings: { byRevenue, byAttendance },
      expiringContracts: expiringContracts.map((c) => ({
        id: c._id.toString(),
        memberName: (c.userId as { name?: string } | null)?.name ?? "Unknown",
        endDate: c.endDate,
      })),
      weeklyCheckins: weekDays,
    });
  } catch (error) {
    console.error("HQ dashboard error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
