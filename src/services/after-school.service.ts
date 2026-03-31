import { connectDB } from "@/lib/db/connect";
import AfterSchool from "@/lib/db/models/AfterSchool";
import { AfterSchoolCreate } from "@/lib/validations/after-school";

export async function listAfterSchool(status?: string) {
  await connectDB();

  const query: Record<string, unknown> = {};
  if (status) query.status = status;

  return AfterSchool.find(query)
    .populate("studentId", "name phone birthDate")
    .sort({ createdAt: -1 })
    .lean();
}

export async function createAfterSchool(data: AfterSchoolCreate) {
  await connectDB();
  return AfterSchool.create(data);
}

export async function updateAfterSchool(id: string, data: Record<string, unknown>) {
  await connectDB();

  const record = await AfterSchool.findByIdAndUpdate(id, data, { new: true });
  if (!record) {
    throw Object.assign(new Error("Record not found."), { statusCode: 404 });
  }
  return record;
}

export async function deleteAfterSchool(id: string) {
  await connectDB();

  const record = await AfterSchool.findByIdAndDelete(id);
  if (!record) {
    throw Object.assign(new Error("Record not found."), { statusCode: 404 });
  }
  return { message: "Deleted." };
}
