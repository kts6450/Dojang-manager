import { connectDB } from "@/lib/db/connect";
import User from "@/lib/db/models/User";
import Tuition from "@/lib/db/models/Tuition";
import Contract from "@/lib/db/models/Contract";
import {
  sendEmail,
  buildOverdueEmail,
  buildContractExpiryEmail,
  buildEventEmail,
  EmailPayload,
} from "@/lib/email/service";

interface SendResult {
  name: string;
  success: boolean;
  error?: string;
}

export async function sendSingleEmail(to: string, subject: string, html: string) {
  if (!to || !subject || !html) {
    throw Object.assign(new Error("To, subject, and html are required."), { statusCode: 400 });
  }
  return sendEmail({ to, subject, html });
}

export async function sendPaymentReminders() {
  await connectDB();

  const overdueTuitions = await Tuition.find({ status: "overdue" })
    .populate("userId", "name email")
    .lean();

  const results: SendResult[] = await Promise.all(
    overdueTuitions.map(async (t) => {
      const user = t.userId as unknown as { name: string; email: string } | null;
      if (!user?.email) return { success: false, name: "Unknown" };
      return {
        name: user.name,
        ...(await sendEmail({
          to: user.email,
          subject: `[Dojang Manager] Tuition Payment Notice - ${user.name}`,
          html: buildOverdueEmail(user.name, t.amount, new Date(t.dueDate)),
        })),
      };
    }),
  );

  return { sent: results.filter((r) => r.success).length, total: results.length, results };
}

export async function sendContractExpiryReminders() {
  await connectDB();

  const soon = new Date();
  soon.setDate(soon.getDate() + 30);

  const expiringContracts = await Contract.find({
    endDate: { $lte: soon },
    status: "signed",
  })
    .populate("userId", "name email")
    .lean();

  const today = new Date();
  const results: SendResult[] = await Promise.all(
    expiringContracts.map(async (c) => {
      const user = c.userId as unknown as { name: string; email: string } | null;
      if (!user?.email) return { success: false, name: "Unknown" };
      const daysLeft = Math.ceil(
        (new Date(c.endDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );
      return {
        name: user.name,
        ...(await sendEmail({
          to: user.email,
          subject: `[Dojang Manager] Contract Expiry Notice - ${daysLeft} days remaining`,
          html: buildContractExpiryEmail(user.name, c.title, new Date(c.endDate), daysLeft),
        })),
      };
    }),
  );

  return { sent: results.filter((r) => r.success).length, total: results.length, results };
}

export async function sendEventNotification(eventId: string) {
  await connectDB();

  const Event = (await import("@/lib/db/models/Event")).default;
  const event = await Event.findById(eventId).lean();
  if (!event) {
    throw Object.assign(new Error("Event not found."), { statusCode: 404 });
  }

  const members = await User.find({
    role: { $in: ["member", "student"] },
    status: "active",
    email: { $exists: true, $ne: "" },
  })
    .select("name email")
    .lean();

  const results: SendResult[] = await Promise.all(
    members.map(async (m) => ({
      name: m.name,
      ...(await sendEmail({
        to: m.email!,
        subject: `[Dojang Manager] Event Notice: ${event.title}`,
        html: buildEventEmail(event.title, new Date(event.date), event.type, event.description),
      } as EmailPayload)),
    })),
  );

  return { sent: results.filter((r) => r.success).length, total: results.length };
}
