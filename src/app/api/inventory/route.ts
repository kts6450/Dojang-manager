import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connect";
import { InventoryItem } from "@/lib/db/models/InventoryItem";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  const query: Record<string, unknown> = {};
  if (category) query.category = category;

  const items = await InventoryItem.find(query).sort({ name: 1 }).lean();
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const body = await req.json();
  const { name, category, quantity, minQuantity, price, supplier, sku, description } = body;

  if (!name) return NextResponse.json({ error: "품목명은 필수입니다." }, { status: 400 });

  const item = await InventoryItem.create({ name, category, quantity: quantity || 0, minQuantity: minQuantity || 0, price: price || 0, supplier, sku, description });
  return NextResponse.json(item, { status: 201 });
}
