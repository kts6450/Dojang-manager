import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connect";
import User from "@/lib/db/models/User";
import Tuition from "@/lib/db/models/Tuition";
import Contract from "@/lib/db/models/Contract";
import {
  sendEmail,
  buildOverdueEmail,
  buildContractExpiryEmail,
  buildEventEmail,
} from "@/lib/email/service";

// POST /api/email  - 알림 유형별 일괄 발송
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ error: "권한 없음" }, { status: 403 });
  }

  const { type, targetId } = await req.json();
  await connectDB();

  if (type === "overdue") {
    // 연체 수강료 회원들에게 일괄 알림
    const overdueTuitions = await Tuition.find({ status: "overdue" })
      .populate("userId", "name email")
      .lean();

    const results = await Promise.all(
      overdueTuitions.map(async (t) => {
        const user = t.userId as unknown as { name: string; email: string } | null;
        if (!user?.email) return { success: false, name: "알 수 없음" };
        return {
          name: user.name,
          ...(await sendEmail({
            to: user.email,
            subject: `[도장 매니저] 수강료 납부 안내 - ${user.name}님`,
            html: buildOverdueEmail(user.name, t.amount, new Date(t.dueDate)),
          })),
        };
      })
    );

    return NextResponse.json({ sent: results.filter((r) => r.success).length, total: results.length, results });

  } else if (type === "contract_expiry") {
    // 30일 이내 만료 예정 계약서 알림
    const soon = new Date();
    soon.setDate(soon.getDate() + 30);

    const expiringContracts = await Contract.find({
      endDate: { $lte: soon },
      status: "signed",
    }).populate("userId", "name email").lean();

    const today = new Date();
    const results = await Promise.all(
      expiringContracts.map(async (c) => {
        const user = c.userId as unknown as { name: string; email: string } | null;
        if (!user?.email) return { success: false, name: "알 수 없음" };
        const daysLeft = Math.ceil((new Date(c.endDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return {
          name: user.name,
          ...(await sendEmail({
            to: user.email,
            subject: `[도장 매니저] 계약 만료 안내 - ${daysLeft}일 남음`,
            html: buildContractExpiryEmail(user.name, c.title, new Date(c.endDate), daysLeft),
          })),
        };
      })
    );

    return NextResponse.json({ sent: results.filter((r) => r.success).length, total: results.length, results });

  } else if (type === "event" && targetId) {
    // 특정 이벤트 공지 전체 회원 발송
    const Event = (await import("@/lib/db/models/Event")).default;
    const event = await Event.findById(targetId).lean();
    if (!event) return NextResponse.json({ error: "이벤트 없음" }, { status: 404 });

    const members = await User.find({
      role: { $in: ["member", "student"] },
      status: "active",
      email: { $exists: true, $ne: "" },
    }).select("name email").lean();

    const results = await Promise.all(
      members.map(async (m) => ({
        name: m.name,
        ...(await sendEmail({
          to: m.email!,
          subject: `[도장 매니저] 이벤트 공지: ${event.title}`,
          html: buildEventEmail(event.title, new Date(event.date), event.type, event.description),
        })),
      }))
    );

    return NextResponse.json({ sent: results.filter((r) => r.success).length, total: results.length });

  } else if (type === "single") {
    // 단일 이메일 발송
    const { to, subject, html } = await req.json();
    const result = await sendEmail({ to, subject, html });
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "알 수 없는 type" }, { status: 400 });
}
