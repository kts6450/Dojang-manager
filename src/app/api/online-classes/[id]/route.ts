import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connect";
import OnlineClass from "@/lib/db/models/OnlineClass";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const body = await req.json();
  const cls = await OnlineClass.findByIdAndUpdate(params.id, body, { new: true });
  if (!cls) return NextResponse.json({ error: "수업을 찾을 수 없습니다." }, { status: 404 });
  return NextResponse.json(cls);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  await OnlineClass.findByIdAndDelete(params.id);
  return NextResponse.json({ message: "삭제됐습니다." });
}
