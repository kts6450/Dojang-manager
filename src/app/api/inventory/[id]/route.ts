import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connect";
import { InventoryItem, InventoryLog } from "@/lib/db/models/InventoryItem";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const body = await req.json();
  const { adjustment, reason, ...updateData } = body;

  if (adjustment !== undefined) {
    const item = await InventoryItem.findById(params.id);
    if (!item) return NextResponse.json({ error: "품목을 찾을 수 없습니다." }, { status: 404 });

    const newQty = item.quantity + adjustment;
    if (newQty < 0) return NextResponse.json({ error: "재고가 부족합니다." }, { status: 400 });

    item.quantity = newQty;
    await item.save();

    await InventoryLog.create({
      itemId: params.id,
      type: adjustment > 0 ? "in" : "out",
      quantity: Math.abs(adjustment),
      reason,
      date: new Date(),
    });

    return NextResponse.json(item);
  }

  const item = await InventoryItem.findByIdAndUpdate(params.id, updateData, { new: true });
  if (!item) return NextResponse.json({ error: "품목을 찾을 수 없습니다." }, { status: 404 });
  return NextResponse.json(item);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  await InventoryItem.findByIdAndDelete(params.id);
  return NextResponse.json({ message: "삭제됐습니다." });
}
