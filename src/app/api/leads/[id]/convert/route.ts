import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connect";
import Lead from "@/lib/db/models/Lead";
import User from "@/lib/db/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await connectDB();

    const lead = await Lead.findById(id);
    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    if (lead.status === "converted") {
      return NextResponse.json({ error: "Lead is already converted" }, { status: 400 });
    }

    // Check duplicate email
    if (lead.email) {
      const existing = await User.findOne({ email: lead.email });
      if (existing) return NextResponse.json({ error: "A member with this email already exists" }, { status: 409 });
    }

    // Generate temp password from phone or random
    const tempPassword = lead.phone?.replace(/\D/g, "").slice(-6) || Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Create member
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const member: any = await User.create({
      name: lead.name,
      email: lead.email ?? `${lead.name.replace(/\s/g, "").toLowerCase()}_${Date.now()}@dojang.local`,
      password: hashedPassword,
      phone: lead.phone,
      role: "MEMBER",
      branchId: lead.branchId ?? session.user.branchId ?? undefined,
      status: "active",
      belt: "white",
      beltLevel: 1,
      joinedAt: new Date(),
    });

    // Mark lead as converted
    await Lead.findByIdAndUpdate(id, {
      status: "converted",
      convertedAt: new Date(),
    });

    return NextResponse.json({
      message: "Lead successfully converted to member",
      memberId: member._id.toString(),
      memberName: member.name,
      tempPassword,
    });
  } catch (error) {
    console.error("Lead convert error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
