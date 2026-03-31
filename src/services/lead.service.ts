import { connectDB } from "@/lib/db/connect";
import Lead from "@/lib/db/models/Lead";

interface ListLeadsQuery {
  status?: string;
  search?: string;
}

export async function listLeads({ status, search }: ListLeadsQuery) {
  await connectDB();

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const leads = await Lead.find(filter).sort({ createdAt: -1 }).lean();
  return leads;
}

interface CreateLeadData {
  name: string;
  phone?: string;
  email?: string;
  source?: string;
  interest?: string;
  notes?: string;
}

export async function createLead(data: CreateLeadData) {
  await connectDB();

  const { name, phone, email, source, interest, notes } = data;

  if (!name) {
    throw Object.assign(new Error("Name is required."), { statusCode: 400 });
  }

  const lead = await Lead.create({ name, phone, email, source, interestedIn: interest, notes });
  return lead;
}

export async function getLead(id: string) {
  await connectDB();

  const lead = await Lead.findById(id).lean();
  if (!lead) {
    throw Object.assign(new Error("Lead not found."), { statusCode: 404 });
  }
  return lead;
}

export async function updateLead(id: string, data: Record<string, unknown>) {
  await connectDB();

  if (data.status === "converted" && !data.convertedAt) {
    data.convertedAt = new Date();
  }

  const lead = await Lead.findByIdAndUpdate(id, data, { new: true });
  if (!lead) {
    throw Object.assign(new Error("Lead not found."), { statusCode: 404 });
  }
  return lead;
}

export async function deleteLead(id: string) {
  await connectDB();

  const lead = await Lead.findByIdAndDelete(id);
  if (!lead) {
    throw Object.assign(new Error("Lead not found."), { statusCode: 404 });
  }
  return { message: "Deleted." };
}

export async function getStats() {
  await connectDB();

  const stats = await Lead.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  return stats;
}
