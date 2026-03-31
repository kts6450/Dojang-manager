import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connect";
import Attendance from "@/lib/db/models/Attendance";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");

  const query: Record<string, unknown> = {};
  if (userId) query.userId = userId;
  if (status) query.status = status;
  if (dateFrom || dateTo) {
    query.date = {};
    if (dateFrom) (query.date as Record<string, Date>).$gte = new Date(dateFrom);
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      (query.date as Record<string, Date>).$lte = end;
    }
  }

  const [records, total] = await Promise.all([
    Attendance.find(query)
      .populate("userId", "name belt")
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Attendance.countDocuments(query),
  ]);

  return NextResponse.json({ records, total });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const body = await req.json();
  const { userId, classType, date, status, method, notes } = body;

  if (!userId || !classType || !date) {
    return NextResponse.json({ error: "회원, 수업 종류, 날짜는 필수입니다." }, { status: 400 });
  }

  const record = await Attendance.create({
    userId, classType, date: new Date(date),
    status: status || "present", method: method || "manual", notes,
  });

  return NextResponse.json(record, { status: 201 });
}
