import { connectDB } from "@/lib/db/connect";
import Contract from "@/lib/db/models/Contract";

interface ListContractsQuery {
  status?: string;
  userId?: string;
}

export async function listContracts({ status, userId }: ListContractsQuery) {
  await connectDB();

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (userId) filter.userId = userId;

  const now = new Date();
  await Contract.updateMany(
    { status: "signed", endDate: { $lt: now } },
    { $set: { status: "expired" } }
  );

  const contracts = await Contract.find(filter)
    .populate("userId", "name phone email")
    .sort({ createdAt: -1 })
    .lean();

  const expiringSoon = await Contract.countDocuments({
    status: "signed",
    endDate: { $gte: now, $lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) },
  });

  return { contracts, expiringSoon };
}

interface CreateContractData {
  userId: string;
  title: string;
  terms?: string;
  startDate: string | Date;
  endDate: string | Date;
  amount?: number;
  notes?: string;
}

export async function createContract(data: CreateContractData) {
  await connectDB();

  const { userId, title, terms, startDate, endDate, amount, notes } = data;

  if (!userId || !title || !startDate || !endDate) {
    throw Object.assign(new Error("Please fill in all required fields."), { statusCode: 400 });
  }

  const contract = await Contract.create({
    userId, title, terms: terms || "", startDate: new Date(startDate),
    endDate: new Date(endDate), amount: amount || 0, notes,
  });

  return contract;
}

export async function getContract(id: string) {
  await connectDB();

  const contract = await Contract.findById(id)
    .populate("userId", "name phone email")
    .lean();

  if (!contract) {
    throw Object.assign(new Error("Contract not found."), { statusCode: 404 });
  }
  return contract;
}

export async function updateContract(id: string, data: Record<string, unknown>) {
  await connectDB();

  if (data.status === "signed" && !data.signedAt) {
    data.signedAt = new Date();
  }

  const contract = await Contract.findByIdAndUpdate(id, data, { new: true });
  if (!contract) {
    throw Object.assign(new Error("Contract not found."), { statusCode: 404 });
  }
  return contract;
}

export async function deleteContract(id: string) {
  await connectDB();

  const contract = await Contract.findByIdAndDelete(id);
  if (!contract) {
    throw Object.assign(new Error("Contract not found."), { statusCode: 404 });
  }
  return { message: "Deleted." };
}
