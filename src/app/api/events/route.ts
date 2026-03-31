import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connect";
import Event from "@/lib/db/models/Event";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const query: Record<string, unknown> = {};
  if (status) query.status = status;

  const events = await Event.find(query)
    .populate("createdBy", "name")
    .populate("participants", "name")
    .sort({ date: 1 })
    .lean();

  return NextResponse.json(events);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const body = await req.json();
  const { title, description, type, date, endDate, location, maxParticipants, fee } = body;

  if (!title || !date) {
    return NextResponse.json({ error: "제목과 날짜는 필수입니다." }, { status: 400 });
  }

  const event = await Event.create({
    title, description, type: type || "other",
    date: new Date(date), endDate: endDate ? new Date(endDate) : undefined,
    location, maxParticipants, fee: fee || 0,
    createdBy: session.user.id,
  });

  return NextResponse.json(event, { status: 201 });
}
