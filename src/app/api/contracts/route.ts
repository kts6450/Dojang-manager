import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connect";
import Contract from "@/lib/db/models/Contract";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const userId = searchParams.get("userId");

  const query: Record<string, unknown> = {};
  if (status) query.status = status;
  if (userId) query.userId = userId;

  const now = new Date();
  await Contract.updateMany(
    { status: "signed", endDate: { $lt: now } },
    { $set: { status: "expired" } }
  );

  const contracts = await Contract.find(query)
    .populate("userId", "name phone email")
    .sort({ createdAt: -1 })
    .lean();

  const expiringSoon = await Contract.countDocuments({
    status: "signed",
    endDate: { $gte: now, $lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) },
  });

  return NextResponse.json({ contracts, expiringSoon });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const body = await req.json();
  const { userId, title, terms, startDate, endDate, amount, notes } = body;

  if (!userId || !title || !startDate || !endDate) {
    return NextResponse.json({ error: "필수 항목을 입력해주세요." }, { status: 400 });
  }

  const contract = await Contract.create({
    userId, title, terms: terms || "", startDate: new Date(startDate),
    endDate: new Date(endDate), amount: amount || 0, notes,
  });

  return NextResponse.json(contract, { status: 201 });
}
