import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connect";
import BeltRank from "@/lib/db/models/BeltRank";
import User from "@/lib/db/models/User";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const body = await req.json();

  const record = await BeltRank.findByIdAndUpdate(params.id, body, { new: true });
  if (!record) return NextResponse.json({ error: "기록을 찾을 수 없습니다." }, { status: 404 });

  if (body.examResult === "pass") {
    await User.findByIdAndUpdate(record.userId, {
      belt: record.belt, beltLevel: record.beltLevel,
    });
  }

  return NextResponse.json(record);
}
