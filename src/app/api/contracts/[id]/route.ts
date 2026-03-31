import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connect";
import Contract from "@/lib/db/models/Contract";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const body = await req.json();
  if (body.status === "signed" && !body.signedAt) body.signedAt = new Date();

  const contract = await Contract.findByIdAndUpdate(params.id, body, { new: true });
  if (!contract) return NextResponse.json({ error: "계약서를 찾을 수 없습니다." }, { status: 404 });
  return NextResponse.json(contract);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  await Contract.findByIdAndDelete(params.id);
  return NextResponse.json({ message: "삭제됐습니다." });
}
