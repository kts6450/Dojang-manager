import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connect";
import Branch from "@/lib/db/models/Branch";
import { logger } from "@/lib/logger";
import { isAdminRole } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const branches = await Branch.find({ status: "active" }).sort({ name: 1 }).lean();
    return NextResponse.json({ branches });
  } catch (error) {
    logger.error("Failed to list branches", { error: String(error) });
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !isAdminRole(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    // Only HQ_ADMIN can create branches
    if (session.user.role !== "HQ_ADMIN") {
      return NextResponse.json({ error: "Only HQ_ADMIN can create branches." }, { status: 403 });
    }

    const body = await req.json();
    const { name, code, address, phone, managerName } = body;
    if (!name || !code) {
      return NextResponse.json({ error: "Name and code are required." }, { status: 400 });
    }

    await connectDB();
    const branch = await Branch.create({ name, code, address, phone, managerName });
    return NextResponse.json(branch, { status: 201 });
  } catch (error) {
    if ((error as Record<string, unknown>).code === 11000) {
      return NextResponse.json({ error: "Branch code already exists." }, { status: 409 });
    }
    logger.error("Failed to create branch", { error: String(error) });
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
