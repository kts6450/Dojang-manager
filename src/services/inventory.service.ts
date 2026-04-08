import { connectDB } from "@/lib/db/connect";
import { InventoryItem, InventoryLog } from "@/lib/db/models/InventoryItem";

interface ListItemsQuery {
  category?: string;
}

export async function listItems({ category }: ListItemsQuery) {
  await connectDB();

  const filter: Record<string, unknown> = {};
  if (category) filter.category = category;

  const items = await InventoryItem.find(filter).sort({ name: 1 }).lean();
  return items;
}

interface CreateItemData {
  name: string;
  category?: string;
  quantity?: number;
  minQuantity?: number;
  price?: number;
  supplier?: string;
  sku?: string;
  description?: string;
}

export async function createItem(data: CreateItemData) {
  await connectDB();

  const { name, category, quantity, minQuantity, price, supplier, sku, description } = data;

  if (!name) {
    throw Object.assign(new Error("Item name is required."), { statusCode: 400 });
  }

  const item = await InventoryItem.create({
    name, category, quantity: quantity || 0, minQuantity: minQuantity || 0,
    price: price || 0, supplier, sku, description,
  });

  return item;
}

export async function getItemById(id: string) {
  await connectDB();

  const item = await InventoryItem.findById(id).lean();
  if (!item) {
    throw Object.assign(new Error("Item not found."), { statusCode: 404 });
  }
  return item;
}

export async function updateItem(id: string, data: Record<string, unknown>) {
  await connectDB();

  const item = await InventoryItem.findByIdAndUpdate(id, data, { new: true });
  if (!item) {
    throw Object.assign(new Error("Item not found."), { statusCode: 404 });
  }
  return item;
}

export async function deleteItem(id: string) {
  await connectDB();

  const item = await InventoryItem.findByIdAndDelete(id);
  if (!item) {
    throw Object.assign(new Error("Item not found."), { statusCode: 404 });
  }
  return { message: "Deleted." };
}

export async function listItemLogs(
  itemId: string,
  opts?: { limit?: number; skip?: number },
) {
  await connectDB();

  const item = await InventoryItem.findById(itemId).lean();
  if (!item) {
    throw Object.assign(new Error("Item not found."), { statusCode: 404 });
  }

  const rawLimit = opts?.limit;
  const limit =
    rawLimit !== undefined && Number.isFinite(rawLimit) ? Math.min(Math.max(Number(rawLimit), 1), 200) : 50;
  const rawSkip = opts?.skip;
  const skip = rawSkip !== undefined && Number.isFinite(rawSkip) ? Math.max(Number(rawSkip), 0) : 0;

  const [logs, total] = await Promise.all([
    InventoryLog.find({ itemId })
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    InventoryLog.countDocuments({ itemId }),
  ]);

  return {
    item: { _id: item._id, name: item.name, sku: item.sku },
    logs,
    total,
    limit,
    skip,
  };
}

export async function adjustQuantity(id: string, adjustment: number, reason?: string) {
  await connectDB();

  const item = await InventoryItem.findById(id);
  if (!item) {
    throw Object.assign(new Error("Item not found."), { statusCode: 404 });
  }

  const newQty = item.quantity + adjustment;
  if (newQty < 0) {
    throw Object.assign(new Error("Insufficient stock."), { statusCode: 400 });
  }

  item.quantity = newQty;
  await item.save();

  await InventoryLog.create({
    itemId: id,
    type: adjustment > 0 ? "in" : "out",
    quantity: Math.abs(adjustment),
    reason,
    date: new Date(),
  });

  return item;
}
