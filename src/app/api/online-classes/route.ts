import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connect";
import OnlineClass from "@/lib/db/models/OnlineClass";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const query: Record<string, unknown> = {};
  if (status) query.status = status;

  const classes = await OnlineClass.find(query)
    .populate("instructor", "name")
    .sort({ scheduledAt: -1 })
    .lean();

  return NextResponse.json(classes);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const body = await req.json();
  const { title, description, platform, meetingUrl, meetingId, passcode, scheduledAt, duration, notes } = body;

  if (!title || !meetingUrl || !scheduledAt) {
    return NextResponse.json({ error: "제목, 링크, 일정은 필수입니다." }, { status: 400 });
  }

  const cls = await OnlineClass.create({
    title, description, platform: platform || "zoom",
    meetingUrl, meetingId, passcode,
    instructor: session.user.id,
    scheduledAt: new Date(scheduledAt),
    duration: duration || 60,
    notes,
  });

  return NextResponse.json(cls, { status: 201 });
}
