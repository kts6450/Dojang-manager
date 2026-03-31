import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connect";
import Tuition from "@/lib/db/models/Tuition";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const query: Record<string, unknown> = {};
  if (userId) query.userId = userId;
  if (status) query.status = status;

  const now = new Date();
  await Tuition.updateMany(
    { status: "pending", dueDate: { $lt: now } },
    { $set: { status: "overdue" } }
  );

  const [items, total] = await Promise.all([
    Tuition.find(query)
      .populate("userId", "name phone")
      .sort({ dueDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Tuition.countDocuments(query),
  ]);

  const summary = await Tuition.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 }, total: { $sum: "$amount" } } },
  ]);

  return NextResponse.json({ items, total, summary });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const body = await req.json();
  const { userId, amount, description, dueDate, notes } = body;

  if (!userId || !amount || !dueDate) {
    return NextResponse.json({ error: "회원, 금액, 납부기한은 필수입니다." }, { status: 400 });
  }

  const item = await Tuition.create({ userId, amount, description, dueDate: new Date(dueDate), notes });
  return NextResponse.json(item, { status: 201 });
}
