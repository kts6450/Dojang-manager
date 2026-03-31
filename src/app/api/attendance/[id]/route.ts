import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connect";
import Attendance from "@/lib/db/models/Attendance";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const body = await req.json();
  const record = await Attendance.findByIdAndUpdate(params.id, body, { new: true });
  if (!record) return NextResponse.json({ error: "기록을 찾을 수 없습니다." }, { status: 404 });
  return NextResponse.json(record);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  await Attendance.findByIdAndDelete(params.id);
  return NextResponse.json({ message: "삭제됐습니다." });
}
