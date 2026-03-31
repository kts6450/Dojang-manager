import { connectDB } from "@/lib/db/connect";
import BeltRank from "@/lib/db/models/BeltRank";
import User from "@/lib/db/models/User";
import Attendance from "@/lib/db/models/Attendance";

const BELT_ORDER = ["white", "yellow", "orange", "green", "blue", "purple", "red", "brown", "black"];
const BELT_LABELS: Record<string, string> = {
  white: "White", yellow: "Yellow", orange: "Orange", green: "Green",
  blue: "Blue", purple: "Purple", red: "Red", brown: "Brown", black: "Black",
};

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

interface ListBeltRanksQuery {
  userId?: string;
  examResult?: string;
}

export async function listBeltRanks({ userId, examResult }: ListBeltRanksQuery) {
  await connectDB();

  const filter: Record<string, unknown> = {};
  if (userId) filter.userId = userId;
  if (examResult) filter.examResult = examResult;

  const records = await BeltRank.find(filter)
    .populate("userId", "name belt beltLevel")
    .populate("examinerId", "name")
    .sort({ examDate: -1 })
    .lean();

  return records;
}

interface CreateBeltRankData {
  userId: string;
  belt: string;
  beltLevel?: number;
  examDate: string | Date;
  examResult?: string;
  examScore?: number;
  notes?: string;
}

export async function createBeltRank(data: CreateBeltRankData) {
  await connectDB();

  const { userId, belt, beltLevel, examDate, examResult, examScore, notes } = data;

  if (!userId || !belt || !examDate) {
    throw Object.assign(new Error("Member, belt, and exam date are required."), { statusCode: 400 });
  }

  const user = await User.findById(userId);
  if (!user) {
    throw Object.assign(new Error("Member not found."), { statusCode: 404 });
  }

  const record = await BeltRank.create({
    userId, belt, beltLevel: beltLevel || 1,
    previousBelt: user.belt, examDate: new Date(examDate),
    examResult: examResult || "pending", examScore, notes,
    promotedAt: examResult === "pass" ? new Date() : undefined,
  });

  if (examResult === "pass") {
    await User.findByIdAndUpdate(userId, { belt, beltLevel: beltLevel || 1 });
  }

  return record;
}

export async function updateBeltRank(id: string, data: Record<string, unknown>) {
  await connectDB();

  const record = await BeltRank.findByIdAndUpdate(id, data, { new: true });
  if (!record) {
    throw Object.assign(new Error("Record not found."), { statusCode: 404 });
  }

  if (data.examResult === "pass") {
    await User.findByIdAndUpdate(record.userId, {
      belt: record.belt,
      beltLevel: record.beltLevel,
    });
  }

  return record;
}

export async function deleteBeltRank(id: string) {
  await connectDB();

  const record = await BeltRank.findByIdAndDelete(id);
  if (!record) {
    throw Object.assign(new Error("Record not found."), { statusCode: 404 });
  }
  return { message: "Deleted." };
}

export async function getEligibleMembers() {
  await connectDB();

  const members = await User.find({ role: { $in: ["member", "student"] }, status: "active" })
    .select("name belt beltLevel joinedAt")
    .lean();

  const eligibleList = [];

  for (const member of members) {
    const currentBelt = member.belt ?? "white";
    if (currentBelt === "black") continue;

    const criteria = PROMOTION_CRITERIA[currentBelt];
    if (!criteria) continue;

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

  eligibleList.sort((a, b) => (b.isEligible ? 1 : 0) - (a.isEligible ? 1 : 0));

  return { members: eligibleList, total: eligibleList.length };
}

export async function promoteMembers(memberId: string, promotedBy?: string) {
  await connectDB();

  const user = await User.findById(memberId).lean();
  if (!user) {
    throw Object.assign(new Error("Member not found."), { statusCode: 404 });
  }

  const currentBelt = user.belt ?? "white";
  const nextBeltIdx = BELT_ORDER.indexOf(currentBelt) + 1;
  if (nextBeltIdx >= BELT_ORDER.length) {
    throw Object.assign(new Error("Already at the highest rank."), { statusCode: 400 });
  }

  const nextBelt = BELT_ORDER[nextBeltIdx];

  const record = await BeltRank.create({
    userId: memberId,
    belt: nextBelt,
    beltLevel: user.beltLevel ?? 1,
    examDate: new Date(),
    examResult: "pass",
    notes: `Auto promotion criteria met (processed by: ${promotedBy ?? "Administrator"})`,
  });

  await User.findByIdAndUpdate(memberId, { belt: nextBelt });

  return {
    success: true,
    message: `${user.name} has been promoted to ${BELT_LABELS[nextBelt]}.`,
    record,
  };
}
