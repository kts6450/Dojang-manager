import { connectDB } from "@/lib/db/connect";
import Tuition from "@/lib/db/models/Tuition";
import type { ServiceContext } from "@/lib/service-context";
import { branchScope } from "@/lib/service-context";

interface ListTuitionQuery {
  userId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export async function listTuition(
  { userId, status, page = 1, limit = 20 }: ListTuitionQuery,
  ctx: ServiceContext
) {
  await connectDB();

  const filter: Record<string, unknown> = { ...branchScope(ctx) };

  // MEMBER/STUDENT: only their own records
  if (ctx.role === "MEMBER" || ctx.role === "STUDENT") {
    filter.userId = ctx.userId;
  } else if (userId) {
    filter.userId = userId;
  }

  if (status) filter.status = status;

  const now = new Date();
  await Tuition.updateMany(
    { status: "pending", dueDate: { $lt: now } },
    { $set: { status: "overdue" } }
  );

  const [items, total] = await Promise.all([
    Tuition.find(filter)
      .populate("userId", "name phone")
      .sort({ dueDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Tuition.countDocuments(filter),
  ]);

  return { items, total };
}

interface CreateTuitionData {
  userId: string;
  amount: number;
  description?: string;
  dueDate: string | Date;
  notes?: string;
}

export async function createTuition(data: CreateTuitionData, ctx: ServiceContext) {
  await connectDB();

  const { userId, amount, description, dueDate, notes } = data;

  if (!userId || !amount || !dueDate) {
    throw Object.assign(new Error("Member, amount, and due date are required."), { statusCode: 400 });
  }

  const item = await Tuition.create({
    userId, amount, description, dueDate: new Date(dueDate), notes,
    branchId: ctx.branchId || undefined,
  });

  return item;
}

export async function updateTuition(id: string, data: Record<string, unknown>, ctx: ServiceContext) {
  await connectDB();

  if (data.status === "paid" && !data.paidAt) {
    data.paidAt = new Date();
  }

  const scopeFilter = branchScope(ctx);
  const item = await Tuition.findOneAndUpdate({ _id: id, ...scopeFilter }, data, { new: true });
  if (!item) {
    throw Object.assign(new Error("Item not found."), { statusCode: 404 });
  }
  return item;
}

export async function deleteTuition(id: string, ctx: ServiceContext) {
  await connectDB();

  const scopeFilter = branchScope(ctx);
  const item = await Tuition.findOneAndDelete({ _id: id, ...scopeFilter });
  if (!item) {
    throw Object.assign(new Error("Item not found."), { statusCode: 404 });
  }
  return { message: "Deleted." };
}

export async function getSummary(ctx: ServiceContext) {
  await connectDB();

  const scopeFilter = branchScope(ctx);
  const summary = await Tuition.aggregate([
    { $match: { ...scopeFilter } },
    { $group: { _id: "$status", count: { $sum: 1 }, total: { $sum: "$amount" } } },
  ]);

  return summary;
}
