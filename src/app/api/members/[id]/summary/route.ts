import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connect";
import User from "@/lib/db/models/User";
import Attendance from "@/lib/db/models/Attendance";
import Tuition from "@/lib/db/models/Tuition";
import BeltRank from "@/lib/db/models/BeltRank";
import Contract from "@/lib/db/models/Contract";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await connectDB();

    const member = await User.findById(id).select("-password").lean();
    if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });

    // Last 6 months attendance stats
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const [attendanceRecords, tuitionRecords, beltHistory, contracts] = await Promise.all([
      Attendance.find({ userId: id, date: { $gte: sixMonthsAgo } })
        .sort({ date: -1 })
        .limit(50)
        .lean(),
      Tuition.find({ userId: id })
        .sort({ dueDate: -1 })
        .limit(12)
        .lean(),
      BeltRank.find({ userId: id })
        .sort({ promotionDate: -1 })
        .lean(),
      Contract.find({ userId: id })
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    // Attendance summary
    const totalAttendance = attendanceRecords.length;
    const presentCount = attendanceRecords.filter((a) => a.status === "present").length;
    const lateCount = attendanceRecords.filter((a) => a.status === "late").length;
    const absentCount = attendanceRecords.filter((a) => a.status === "absent").length;

    // Monthly attendance for chart
    const monthlyMap: Record<string, number> = {};
    attendanceRecords.forEach((a) => {
      if (a.status === "present" || a.status === "late") {
        const key = new Date(a.date).toISOString().slice(0, 7); // "2024-01"
        monthlyMap[key] = (monthlyMap[key] ?? 0) + 1;
      }
    });
    const monthlyAttendance = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, count }));

    // Tuition summary
    const unpaidTuition = tuitionRecords.filter((t) => t.status === "pending" || t.status === "overdue");
    const totalUnpaid = unpaidTuition.reduce((sum, t) => sum + (t.amount ?? 0), 0);

    // Active contract
    const now = new Date();
    const activeContract = contracts.find(
      (c) => c.status === "signed" && new Date(c.endDate) >= now
    );

    return NextResponse.json({
      member,
      attendanceSummary: {
        total: totalAttendance,
        present: presentCount,
        late: lateCount,
        absent: absentCount,
        attendanceRate: totalAttendance > 0 ? Math.round(((presentCount + lateCount) / totalAttendance) * 100) : 0,
      },
      monthlyAttendance,
      recentAttendance: attendanceRecords.slice(0, 10),
      tuitionSummary: {
        totalUnpaid,
        unpaidCount: unpaidTuition.length,
      },
      recentTuition: tuitionRecords.slice(0, 6),
      beltHistory,
      activeContract: activeContract ?? null,
      contracts,
    });
  } catch (error) {
    console.error("Member summary error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
