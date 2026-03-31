import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connect";
import Lead from "@/lib/db/models/Lead";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const status = req.nextUrl.searchParams.get("status");
  const search = req.nextUrl.searchParams.get("search");

  const query: Record<string, unknown> = {};
  if (status) query.status = status;
  if (search) query.$or = [
    { name: { $regex: search, $options: "i" } },
    { phone: { $regex: search, $options: "i" } },
    { email: { $regex: search, $options: "i" } },
  ];

  const leads = await Lead.find(query).sort({ createdAt: -1 }).lean();

  const stats = await Lead.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  return NextResponse.json({ leads, stats });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const body = await req.json();
  const lead = await Lead.create(body);
  return NextResponse.json(lead, { status: 201 });
}
