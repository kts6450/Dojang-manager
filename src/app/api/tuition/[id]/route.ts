import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connect";
import Tuition from "@/lib/db/models/Tuition";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const body = await req.json();
  if (body.status === "paid" && !body.paidAt) body.paidAt = new Date();
  const item = await Tuition.findByIdAndUpdate(params.id, body, { new: true });
  if (!item) return NextResponse.json({ error: "항목을 찾을 수 없습니다." }, { status: 404 });
  return NextResponse.json(item);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  await Tuition.findByIdAndDelete(params.id);
  return NextResponse.json({ message: "삭제됐습니다." });
}
