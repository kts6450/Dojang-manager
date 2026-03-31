import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connect";
import User from "@/lib/db/models/User";
import Attendance from "@/lib/db/models/Attendance";
import BeltRank from "@/lib/db/models/BeltRank";

// 벨트 순서 (흰띠 → 검정띠)
const BELT_ORDER = ["white", "yellow", "orange", "green", "blue", "purple", "red", "brown", "black"];
const BELT_LABELS: Record<string, string> = {
  white: "흰띠", yellow: "노란띠", orange: "주황띠", green: "초록띠",
  blue: "파란띠", purple: "보라띠", red: "빨간띠", brown: "갈색띠", black: "검정띠",
};

// 승급 기준: 각 벨트별 [최소 출석 횟수, 최소 재적 일수]
const PROMOTION_CRITERIA: Record<string, { minAttendance: number; minDays: number }> = {
  white:  { minAttendance: 20,  minDays: 30  },
  yellow: { minAttendance: 30,  minDays: 60  },
  orange: { minAttendance: 40,  minDays: 90  },
  green:  { minAttendance: 50,  minDays: 120 },
  blue:   { minAttendance: 60,  minDays: 150 },
  purple: { minAttendance: 70,  minDays: 180 },
  red:    { minAttendance: 80,  minDays: 210 },
  brown:  { minAttendance: 100, minDays: 270 },
};

// GET: 승급 가능 회원 목록 조회
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const members = await User.find({ role: { $in: ["member", "student"] }, status: "active" })
    .select("name belt beltLevel joinedAt")
    .lean();

  const eligibleList = [];

  for (const member of members) {
    const currentBelt = member.belt ?? "white";
    if (currentBelt === "black") continue; // 검정띠는 자동 승급 없음

    const criteria = PROMOTION_CRITERIA[currentBelt];
    if (!criteria) continue;

    // 현재 벨트 취득 이후 출석 횟수
    const lastPromotion = await BeltRank.findOne({ userId: member._id, belt: currentBelt, examResult: "pass" })
      .sort({ examDate: -1 }).lean();

    const sinceDate = lastPromotion ? new Date(lastPromotion.examDate) : new Date(member.joinedAt);

    const attendanceCount = await Attendance.countDocuments({
      userId: member._id,
      status: "present",
      date: { $gte: sinceDate },
    });

    const daysSince = Math.floor((Date.now() - sinceDate.getTime()) / (1000 * 60 * 60 * 24));

    const nextBeltIdx = BELT_ORDER.indexOf(currentBelt) + 1;
    const nextBelt = BELT_ORDER[nextBeltIdx];

    const isEligible = attendanceCount >= criteria.minAttendance && daysSince >= criteria.minDays;

    eligibleList.push({
      memberId: String(member._id),
      memberName: member.name,
      currentBelt,
      currentBeltLabel: BELT_LABELS[currentBelt],
      nextBelt,
      nextBeltLabel: nextBelt ? BELT_LABELS[nextBelt] : null,
      attendanceCount,
      minAttendance: criteria.minAttendance,
      daysSince,
      minDays: criteria.minDays,
      isEligible,
      sinceDate: sinceDate.toISOString(),
    });
  }

  // 승급 가능한 회원을 위로
  eligibleList.sort((a, b) => (b.isEligible ? 1 : 0) - (a.isEligible ? 1 : 0));

  return NextResponse.json({ members: eligibleList, total: eligibleList.length });
}

// POST: 특정 회원 승급 처리
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { memberId } = await req.json();
  if (!memberId) return NextResponse.json({ error: "회원 ID 필요" }, { status: 400 });

  await connectDB();

  const user = await User.findById(memberId).lean();
  if (!user) return NextResponse.json({ error: "회원 없음" }, { status: 404 });

  const currentBelt = user.belt ?? "white";
  const nextBeltIdx = BELT_ORDER.indexOf(currentBelt) + 1;
  if (nextBeltIdx >= BELT_ORDER.length) {
    return NextResponse.json({ error: "이미 최고 등급입니다." }, { status: 400 });
  }

  const nextBelt = BELT_ORDER[nextBeltIdx];

  // 승급 기록 생성
  const record = await BeltRank.create({
    userId: memberId,
    belt: nextBelt,
    beltLevel: (user.beltLevel ?? 1),
    examDate: new Date(),
    examResult: "pass",
    notes: `자동 승급 기준 충족 (처리자: ${session.user?.name ?? "관리자"})`,
  });

  // 회원 벨트 업데이트
  await User.findByIdAndUpdate(memberId, { belt: nextBelt });

  return NextResponse.json({
    success: true,
    message: `${user.name}님이 ${BELT_LABELS[nextBelt]}으로 승급됐습니다.`,
    record,
  });
}
