import { connectDB } from "@/lib/db/connect";
import User from "@/lib/db/models/User";
import bcrypt from "bcryptjs";
import type { ServiceContext } from "@/lib/service-context";
import { branchScope } from "@/lib/service-context";

const UPDATABLE_FIELDS = [
  "name", "phone", "belt", "beltLevel", "birthDate",
  "address", "emergencyContact", "notes", "status", "password",
] as const;

function pickAllowed(body: Record<string, unknown>) {
  const result: Record<string, unknown> = {};
  for (const key of UPDATABLE_FIELDS) {
    if (key in body) result[key] = body[key];
  }
  return result;
}

interface ListMembersQuery {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export async function listMembers(
  { search, role, status, page = 1, limit = 20 }: ListMembersQuery,
  ctx: ServiceContext
) {
  await connectDB();

  const filter: Record<string, unknown> = { ...branchScope(ctx) };

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];
  }
  if (role) filter.role = role;
  if (status) filter.status = status;

  // MEMBER/STUDENT can only see themselves
  if (ctx.role === "MEMBER" || ctx.role === "STUDENT") {
    filter._id = ctx.userId;
  }

  const [members, total] = await Promise.all([
    User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  return { members, total, page, totalPages: Math.ceil(total / limit) };
}

interface CreateMemberData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: string;
  belt?: string;
  beltLevel?: number;
  birthDate?: string | Date;
  address?: string;
  emergencyContact?: string;
  notes?: string;
}

export async function createMember(data: CreateMemberData, ctx: ServiceContext) {
  await connectDB();

  const { name, email, password, phone, role, belt, beltLevel, birthDate, address, emergencyContact, notes } = data;

  if (!name || !email || !password) {
    throw Object.assign(new Error("Name, email, and password are required."), { statusCode: 400 });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    throw Object.assign(new Error("This email is already registered."), { statusCode: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const assignedBranchId: string | undefined = ctx.role === "BRANCH_ADMIN"
    ? (ctx.branchId ?? undefined)
    : ((data as unknown as Record<string, unknown>).branchId as string | undefined) ?? ctx.branchId ?? undefined;

  const created = await User.insertMany([{
    name, email, password: hashedPassword, phone,
    role: role || "MEMBER", belt: belt || "white", beltLevel: beltLevel || 1,
    birthDate, address, emergencyContact, notes,
    branchId: assignedBranchId || undefined,
  }]);
  const newUser = created[0];
  const userObj = newUser.toObject() as unknown as Record<string, unknown>;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _pw, ...userData } = userObj;
  return userData;
}

export async function getMember(id: string, ctx: ServiceContext) {
  await connectDB();

  const scopeFilter = branchScope(ctx);
  const idFilter = (ctx.role === "MEMBER" || ctx.role === "STUDENT") ? ctx.userId : id;
  const filter: Record<string, unknown> = { _id: idFilter, ...scopeFilter };

  const user = await User.findOne(filter).select("-password").lean();
  if (!user) {
    throw Object.assign(new Error("Member not found."), { statusCode: 404 });
  }
  return user;
}

export async function updateMember(id: string, body: Record<string, unknown>, ctx: ServiceContext) {
  await connectDB();

  // Only HQ_ADMIN/BRANCH_ADMIN can update members
  if (ctx.role === "MEMBER" || ctx.role === "STUDENT") {
    throw Object.assign(new Error("Forbidden."), { statusCode: 403 });
  }

  const update = pickAllowed(body);

  if (update.password) {
    update.password = await bcrypt.hash(update.password as string, 12);
  } else {
    delete update.password;
  }

  if (Object.keys(update).length === 0) {
    throw Object.assign(new Error("No fields to update."), { statusCode: 400 });
  }

  const scopeFilter = branchScope(ctx);
  const user = await User.findOneAndUpdate(
    { _id: id, ...scopeFilter },
    update,
    { new: true }
  ).select("-password").lean();
  if (!user) {
    throw Object.assign(new Error("Member not found."), { statusCode: 404 });
  }
  return user;
}

export async function deleteMember(id: string, ctx: ServiceContext) {
  await connectDB();

  if (ctx.role === "MEMBER" || ctx.role === "STUDENT") {
    throw Object.assign(new Error("Forbidden."), { statusCode: 403 });
  }

  const scopeFilter = branchScope(ctx);
  const deleted = await User.findOneAndDelete({ _id: id, ...scopeFilter });
  if (!deleted) {
    throw Object.assign(new Error("Member not found."), { statusCode: 404 });
  }
  return { message: "Successfully deleted." };
}
