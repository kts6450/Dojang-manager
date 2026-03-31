import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connect";
import AfterSchool from "@/lib/db/models/AfterSchool";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const query: Record<string, unknown> = {};
  if (status) query.status = status;

  const records = await AfterSchool.find(query)
    .populate("studentId", "name phone birthDate")
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json(records);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const body = await req.json();
  const { studentId, programName, schedule, startDate, endDate, tuitionAmount, notes } = body;

  if (!studentId || !programName || !startDate) {
    return NextResponse.json({ error: "학생, 프로그램명, 시작일은 필수입니다." }, { status: 400 });
  }

  const record = await AfterSchool.create({
    studentId, programName, schedule, startDate: new Date(startDate),
    endDate: endDate ? new Date(endDate) : undefined, tuitionAmount, notes,
  });

  return NextResponse.json(record, { status: 201 });
}
