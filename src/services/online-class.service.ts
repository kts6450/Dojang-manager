import { connectDB } from "@/lib/db/connect";
import OnlineClass from "@/lib/db/models/OnlineClass";
import { OnlineClassCreate } from "@/lib/validations/online-class";

export async function listOnlineClasses(status?: string) {
  await connectDB();

  const query: Record<string, unknown> = {};
  if (status) query.status = status;

  return OnlineClass.find(query)
    .populate("instructor", "name")
    .sort({ scheduledAt: -1 })
    .lean();
}

export async function createOnlineClass(data: OnlineClassCreate) {
  await connectDB();
  return OnlineClass.create(data);
}

export async function updateOnlineClass(id: string, data: Record<string, unknown>) {
  await connectDB();

  const cls = await OnlineClass.findByIdAndUpdate(id, data, { new: true });
  if (!cls) {
    throw Object.assign(new Error("Class not found."), { statusCode: 404 });
  }
  return cls;
}

export async function deleteOnlineClass(id: string) {
  await connectDB();

  const cls = await OnlineClass.findByIdAndDelete(id);
  if (!cls) {
    throw Object.assign(new Error("Class not found."), { statusCode: 404 });
  }
  return { message: "Deleted." };
}
