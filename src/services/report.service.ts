import { connectDB } from "@/lib/db/connect";
import User from "@/lib/db/models/User";
import Attendance from "@/lib/db/models/Attendance";
import Tuition from "@/lib/db/models/Tuition";
import BeltRank from "@/lib/db/models/BeltRank";

type ReportType = "members" | "attendance" | "tuition" | "belt";

interface ReportResult {
  rows: Record<string, unknown>[];
  sheetName: string;
  colWidths: number[];
}

export async function getYearlyReport(year: number) {
  await connectDB();

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
    const found = monthlyAttendance.find((a: { _id: number }) => a._id === m);
    return { month: m, total: found?.total ?? 0, present: found?.present ?? 0, absent: found?.absent ?? 0, late: found?.late ?? 0 };
  });

  const tuitionByMonth = months.map((m) => {
    const found = monthlyTuition.find((t: { _id: number }) => t._id === m);
    return { month: m, total: found?.total ?? 0, count: found?.count ?? 0 };
  });

  const totalRevenue = tuitionByMonth.reduce((sum, t) => sum + t.total, 0);
  const totalAttendance = attendanceByMonth.reduce((sum, a) => sum + a.present, 0);

  return {
    summary: { totalMembers, activeMembers, totalRevenue, totalAttendance },
    membersByRole,
    attendanceByMonth,
    tuitionByMonth,
    beltDistribution,
  };
}

const BELT_LABELS: Record<string, string> = {
  white: "White", yellow: "Yellow", orange: "Orange", green: "Green",
  blue: "Blue", purple: "Purple", red: "Red", brown: "Brown", black: "Black",
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrator", instructor: "Instructor", member: "Member", student: "Student",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Active", inactive: "Inactive", pending: "Pending",
};

const ATTENDANCE_STATUS_LABELS: Record<string, string> = {
  present: "Present", absent: "Absent", late: "Late", excused: "Excused",
};

const TUITION_STATUS_LABELS: Record<string, string> = {
  pending: "Pending", paid: "Paid", overdue: "Overdue", cancelled: "Cancelled",
};

async function generateMembersReport(): Promise<ReportResult> {
  const members = await User.find({ role: { $in: ["member", "student", "instructor"] } })
    .select("name email phone role belt beltLevel status joinedAt birthDate")
    .lean();

  const rows = members.map((m) => ({
    Name: m.name,
    Email: m.email,
    Phone: m.phone ?? "-",
    Role: ROLE_LABELS[m.role] ?? m.role,
    Belt: BELT_LABELS[m.belt ?? "white"] ?? m.belt,
    "Belt Level": m.beltLevel ?? 1,
    Status: STATUS_LABELS[m.status] ?? m.status,
    "Joined Date": m.joinedAt ? new Date(m.joinedAt).toLocaleDateString("en-US") : "-",
    "Birth Date": m.birthDate ? new Date(m.birthDate).toLocaleDateString("en-US") : "-",
  }));

  return { rows, sheetName: "Member List", colWidths: [16, 24, 15, 8, 8, 10, 8, 12, 12] };
}

async function generateAttendanceReport(): Promise<ReportResult> {
  const records = await Attendance.find()
    .populate("userId", "name")
    .sort({ date: -1 })
    .limit(1000)
    .lean();

  const rows = records.map((r) => ({
    "Member Name": (r.userId as { name?: string })?.name ?? "-",
    Date: new Date(r.date).toLocaleDateString("en-US"),
    "Class Type": r.classType ?? "-",
    Status: ATTENDANCE_STATUS_LABELS[r.status] ?? r.status,
    "Check-in Method": r.method === "qr" ? "QR" : "Manual",
    Notes: r.notes ?? "",
  }));

  return { rows, sheetName: "Attendance Records", colWidths: [14, 12, 14, 8, 10, 20] };
}

async function generateTuitionReport(): Promise<ReportResult> {
  const records = await Tuition.find()
    .populate("userId", "name")
    .sort({ dueDate: -1 })
    .limit(1000)
    .lean();

  const rows = records.map((r) => ({
    "Member Name": (r.userId as { name?: string })?.name ?? "-",
    Description: r.description ?? "-",
    Amount: r.amount,
    "Due Date": new Date(r.dueDate).toLocaleDateString("en-US"),
    Status: TUITION_STATUS_LABELS[r.status] ?? r.status,
    "Paid Date": r.paidAt ? new Date(r.paidAt).toLocaleDateString("en-US") : "-",
  }));

  return { rows, sheetName: "Tuition Status", colWidths: [14, 20, 10, 12, 10, 12] };
}

async function generateBeltReport(): Promise<ReportResult> {
  const records = await BeltRank.find()
    .populate("userId", "name")
    .sort({ examDate: -1 })
    .limit(1000)
    .lean();

  const rows = records.map((r) => ({
    "Member Name": (r.userId as { name?: string })?.name ?? "-",
    "Belt Earned": BELT_LABELS[r.belt] ?? r.belt,
    "Belt Level": r.beltLevel,
    "Exam Date": new Date(r.examDate).toLocaleDateString("en-US"),
    Result: r.examResult === "pass" ? "Pass" : r.examResult === "fail" ? "Fail" : "Pending",
    Examiner: r.examinerId ? String(r.examinerId) : "-",
    Notes: r.notes ?? "",
  }));

  return { rows, sheetName: "Promotion Records", colWidths: [14, 10, 10, 12, 8, 14, 20] };
}

const reportGenerators: Record<ReportType, () => Promise<ReportResult>> = {
  members: generateMembersReport,
  attendance: generateAttendanceReport,
  tuition: generateTuitionReport,
  belt: generateBeltReport,
};

export async function generateReport(type: string): Promise<ReportResult> {
  await connectDB();

  const generator = reportGenerators[type as ReportType];
  if (!generator) {
    throw Object.assign(new Error("Invalid report type"), { statusCode: 400 });
  }

  return generator();
}
