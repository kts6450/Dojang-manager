import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connect";
import User from "@/lib/db/models/User";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const user = await User.findById(params.id).select("-password").lean();
  if (!user) return NextResponse.json({ error: "회원을 찾을 수 없습니다." }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const body = await req.json();

  if (body.password) {
    body.password = await bcrypt.hash(body.password, 12);
  } else {
    delete body.password;
  }

  const user = await User.findByIdAndUpdate(params.id, body, { new: true }).select("-password").lean();
  if (!user) return NextResponse.json({ error: "회원을 찾을 수 없습니다." }, { status: 404 });
  return NextResponse.json(user);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  await User.findByIdAndDelete(params.id);
  return NextResponse.json({ message: "삭제되었습니다." });
}
