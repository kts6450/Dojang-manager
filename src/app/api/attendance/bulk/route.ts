import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connect";
import Attendance from "@/lib/db/models/Attendance";
import User from "@/lib/db/models/User";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { classType, date, records } = await req.json();
    // records: Array<{ userId: string; status: "present" | "absent" | "late" | "excused" }>

    if (!classType || !date || !Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ error: "classType, date, and records are required" }, { status: 400 });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const branchId = session.user.branchId ?? undefined;

    const ops = records.map(({ userId, status }: { userId: string; status: string }) => ({
      updateOne: {
        filter: {
          userId,
          classType,
          date: attendanceDate,
        },
        update: {
          $set: {
            status: status ?? "present",
            method: "manual",
            branchId,
            checkInTime: status === "present" || status === "late" ? new Date() : undefined,
          },
          $setOnInsert: { userId, classType, date: attendanceDate },
        },
        upsert: true,
      },
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await Attendance.bulkWrite(ops as any);

    return NextResponse.json({
      message: "Bulk attendance saved",
      inserted: result.upsertedCount,
      updated: result.modifiedCount,
    });
  } catch (error) {
    console.error("Bulk attendance error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET: returns all active members for a bulk check-in session
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const branchId = session.user.branchId;
  const filter: Record<string, unknown> = { status: "active", role: { $in: ["MEMBER", "STUDENT"] } };
  if (branchId) filter.branchId = branchId;

  const members = await User.find(filter).select("_id name belt beltLevel").sort({ name: 1 }).lean();
  return NextResponse.json(members);
}
