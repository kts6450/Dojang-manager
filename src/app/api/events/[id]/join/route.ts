import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connect";
import Event from "@/lib/db/models/Event";
import mongoose from "mongoose";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await connectDB();

    // Support explicit userId from body (admin registering on behalf),
    // otherwise use the session's user
    const body = await req.json().catch(() => ({}));
    const targetUserId: string = body.userId ?? session.user.id;
    const action: "join" | "leave" = body.action ?? "join";

    const event = await Event.findById(id);
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
    if (event.status === "cancelled" || event.status === "completed") {
      return NextResponse.json({ error: "This event is no longer accepting registrations" }, { status: 400 });
    }

    const userObjId = new mongoose.Types.ObjectId(targetUserId);
    const isParticipant = event.participants.some((p) => p.equals(userObjId));

    if (action === "join") {
      if (isParticipant) {
        return NextResponse.json({ error: "Already registered" }, { status: 400 });
      }
      if (event.maxParticipants && event.participants.length >= event.maxParticipants) {
        return NextResponse.json({ error: "Event is at full capacity" }, { status: 400 });
      }
      event.participants.push(userObjId);
      await event.save();
      return NextResponse.json({
        message: "Successfully registered",
        participantCount: event.participants.length,
      });
    } else {
      if (!isParticipant) {
        return NextResponse.json({ error: "Not registered for this event" }, { status: 400 });
      }
      event.participants = event.participants.filter((p) => !p.equals(userObjId));
      await event.save();
      return NextResponse.json({
        message: "Successfully unregistered",
        participantCount: event.participants.length,
      });
    }
  } catch (error) {
    console.error("Event join error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
