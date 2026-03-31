import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connect";
import User from "@/lib/db/models/User";
import Attendance from "@/lib/db/models/Attendance";
import Tuition from "@/lib/db/models/Tuition";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(year, 11, 31, 23, 59, 59);

  const [
    totalMembers,
    activeMembers,
    membersByRole,
    monthlyAttendance,
    monthlyTuition,
    beltDistribution,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ status: "active" }),
    User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]),
    Attendance.aggregate([
      { $match: { date: { $gte: startOfYear, $lte: endOfYear } } },
      {
        $group: {
          _id: { $month: "$date" },
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ["$status", "late"] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Tuition.aggregate([
      { $match: { paidAt: { $gte: startOfYear, $lte: endOfYear } } },
      {
        $group: {
          _id: { $month: "$paidAt" },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    User.aggregate([
      { $match: { role: { $in: ["member", "student"] } } },
      { $group: { _id: "$belt", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const attendanceByMonth = months.map((m) => {
    const found = monthlyAttendance.find((a) => a._id === m);
    return { month: m, total: found?.total ?? 0, present: found?.present ?? 0, absent: found?.absent ?? 0, late: found?.late ?? 0 };
  });

  const tuitionByMonth = months.map((m) => {
    const found = monthlyTuition.find((t) => t._id === m);
    return { month: m, total: found?.total ?? 0, count: found?.count ?? 0 };
  });

  const totalRevenue = tuitionByMonth.reduce((sum, t) => sum + t.total, 0);
  const totalAttendance = attendanceByMonth.reduce((sum, a) => sum + a.present, 0);

  return NextResponse.json({
    summary: { totalMembers, activeMembers, totalRevenue, totalAttendance },
    membersByRole,
    attendanceByMonth,
    tuitionByMonth,
    beltDistribution,
  });
}
