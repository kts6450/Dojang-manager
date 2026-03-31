import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connect";
import BeltRank from "@/lib/db/models/BeltRank";
import User from "@/lib/db/models/User";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const examResult = searchParams.get("examResult");

  const query: Record<string, unknown> = {};
  if (userId) query.userId = userId;
  if (examResult) query.examResult = examResult;

  const records = await BeltRank.find(query)
    .populate("userId", "name belt beltLevel")
    .populate("examinerId", "name")
    .sort({ examDate: -1 })
    .lean();

  return NextResponse.json(records);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const body = await req.json();
  const { userId, belt, beltLevel, examDate, examResult, examScore, notes } = body;

  if (!userId || !belt || !examDate) {
    return NextResponse.json({ error: "회원, 벨트, 심사일은 필수입니다." }, { status: 400 });
  }

  const user = await User.findById(userId);
  if (!user) return NextResponse.json({ error: "회원을 찾을 수 없습니다." }, { status: 404 });

  const record = await BeltRank.create({
    userId, belt, beltLevel: beltLevel || 1,
    previousBelt: user.belt, examDate: new Date(examDate),
    examResult: examResult || "pending", examScore, notes,
    promotedAt: examResult === "pass" ? new Date() : undefined,
  });

  if (examResult === "pass") {
    await User.findByIdAndUpdate(userId, { belt, beltLevel: beltLevel || 1 });
  }

  return NextResponse.json(record, { status: 201 });
}
