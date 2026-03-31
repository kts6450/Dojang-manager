import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import User from "@/lib/db/models/User";
import Attendance from "@/lib/db/models/Attendance";

// QR 코드로 출석 체크 (인증 없이도 접근 가능 - QR 스캔 페이지용)
export async function POST(req: NextRequest) {
  try {
    const { memberId, classType } = await req.json();
    if (!memberId) return NextResponse.json({ error: "회원 ID가 필요합니다." }, { status: 400 });

    await connectDB();

    const user = await User.findById(memberId).select("name belt role status").lean();
    if (!user) return NextResponse.json({ error: "존재하지 않는 회원입니다." }, { status: 404 });
    if (user.status !== "active") return NextResponse.json({ error: "비활성 회원입니다." }, { status: 400 });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 오늘 이미 체크인했는지 확인
    const existing = await Attendance.findOne({
      userId: memberId,
      date: { $gte: today, $lt: tomorrow },
    });

    if (existing) {
      return NextResponse.json({
        success: false,
        alreadyChecked: true,
        message: `${user.name}님은 이미 오늘 출석 체크되었습니다.`,
        user: { name: user.name, belt: user.belt },
      });
    }

    await Attendance.create({
      userId: memberId,
      classType: classType ?? "일반 수업",
      date: new Date(),
      status: "present",
      method: "qr",
    });

    return NextResponse.json({
      success: true,
      message: `${user.name}님 출석 체크 완료!`,
      user: { name: user.name, belt: user.belt },
    });
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
