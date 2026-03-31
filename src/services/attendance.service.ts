import { connectDB } from "@/lib/db/connect";
import Attendance from "@/lib/db/models/Attendance";
import User from "@/lib/db/models/User";

interface ListAttendanceQuery {
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export async function listAttendance({ userId, dateFrom, dateTo, status, page = 1, limit = 50 }: ListAttendanceQuery) {
  await connectDB();

  const filter: Record<string, unknown> = {};
  if (userId) filter.userId = userId;
  if (status) filter.status = status;
  if (dateFrom || dateTo) {
    filter.date = {};
    if (dateFrom) (filter.date as Record<string, Date>).$gte = new Date(dateFrom);
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      (filter.date as Record<string, Date>).$lte = end;
    }
  }

  const [records, total] = await Promise.all([
    Attendance.find(filter)
      .populate("userId", "name belt")
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Attendance.countDocuments(filter),
  ]);

  return { records, total };
}

interface CreateAttendanceData {
  userId: string;
  classType: string;
  date: string | Date;
  checkInTime?: string | Date;
  checkOutTime?: string | Date;
  status?: string;
  method?: string;
  notes?: string;
}

export async function createAttendance(data: CreateAttendanceData) {
  await connectDB();

  const { userId, classType, date, status, method, notes } = data;

  if (!userId || !classType || !date) {
    throw Object.assign(new Error("Member, class type, and date are required."), { statusCode: 400 });
  }

  const record = await Attendance.create({
    userId, classType, date: new Date(date),
    status: status || "present", method: method || "manual", notes,
  });

  return record;
}

export async function updateAttendance(id: string, data: Record<string, unknown>) {
  await connectDB();

  const record = await Attendance.findByIdAndUpdate(id, data, { new: true });
  if (!record) {
    throw Object.assign(new Error("Record not found."), { statusCode: 404 });
  }
  return record;
}

export async function deleteAttendance(id: string) {
  await connectDB();

  const record = await Attendance.findByIdAndDelete(id);
  if (!record) {
    throw Object.assign(new Error("Record not found."), { statusCode: 404 });
  }
  return { message: "Deleted." };
}

export async function qrCheckIn(memberId: string, classType?: string) {
  await connectDB();

  const user = await User.findById(memberId).select("name belt role status").lean();
  if (!user) {
    throw Object.assign(new Error("Member not found."), { statusCode: 404 });
  }
  if (user.status !== "active") {
    throw Object.assign(new Error("Member is inactive."), { statusCode: 400 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const existing = await Attendance.findOne({
    userId: memberId,
    date: { $gte: today, $lt: tomorrow },
  });

  if (existing) {
    return {
      success: false,
      alreadyChecked: true,
      message: `${user.name} has already checked in today.`,
      user: { name: user.name, belt: user.belt },
    };
  }

  await Attendance.create({
    userId: memberId,
    classType: classType ?? "General class",
    date: new Date(),
    status: "present",
    method: "qr",
  });

  return {
    success: true,
    message: `Check-in complete for ${user.name}!`,
    user: { name: user.name, belt: user.belt },
  };
}

interface StatsQuery {
  year?: number;
  month?: number;
}

export async function getStats({ year, month }: StatsQuery) {
  await connectDB();

  const now = new Date();
  const y = year ?? now.getFullYear();
  const m = month ?? now.getMonth() + 1;

  const startDate = new Date(y, m - 1, 1);
  const endDate = new Date(y, m, 0, 23, 59, 59);

  const [daily, summary] = await Promise.all([
    Attendance.aggregate([
      { $match: { date: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ["$status", "late"] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Attendance.aggregate([
      { $match: { date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
  ]);

  return { daily, summary };
}
