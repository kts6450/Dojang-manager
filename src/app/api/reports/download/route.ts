import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connect";
import User from "@/lib/db/models/User";
import Attendance from "@/lib/db/models/Attendance";
import Tuition from "@/lib/db/models/Tuition";
import BeltRank from "@/lib/db/models/BeltRank";
import * as XLSX from "xlsx";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const type = req.nextUrl.searchParams.get("type") ?? "members";
  await connectDB();

  let workbook: XLSX.WorkBook;

  if (type === "members") {
    const members = await User.find({ role: { $in: ["member", "student", "instructor"] } })
      .select("name email phone role belt beltLevel status joinedAt birthDate")
      .lean();

    const BELT_LABELS: Record<string, string> = {
      white: "흰띠", yellow: "노란띠", orange: "주황띠", green: "초록띠",
      blue: "파란띠", purple: "보라띠", red: "빨간띠", brown: "갈색띠", black: "검정띠",
    };
    const ROLE_LABELS: Record<string, string> = {
      admin: "관리자", instructor: "강사", member: "회원", student: "학생",
    };
    const STATUS_LABELS: Record<string, string> = {
      active: "활성", inactive: "비활성", pending: "대기",
    };

    const rows = members.map((m) => ({
      이름: m.name,
      이메일: m.email,
      연락처: m.phone ?? "-",
      역할: ROLE_LABELS[m.role] ?? m.role,
      벨트: BELT_LABELS[m.belt ?? "white"] ?? m.belt,
      "벨트 레벨": m.beltLevel ?? 1,
      상태: STATUS_LABELS[m.status] ?? m.status,
      등록일: m.joinedAt ? new Date(m.joinedAt).toLocaleDateString("ko-KR") : "-",
      생년월일: m.birthDate ? new Date(m.birthDate).toLocaleDateString("ko-KR") : "-",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [16, 24, 15, 8, 8, 10, 8, 12, 12].map((w) => ({ wch: w }));
    workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, ws, "회원 목록");

  } else if (type === "attendance") {
    const records = await Attendance.find()
      .populate("userId", "name")
      .sort({ date: -1 })
      .limit(1000)
      .lean();

    const STATUS_LABELS: Record<string, string> = {
      present: "출석", absent: "결석", late: "지각", excused: "공결",
    };

    const rows = records.map((r) => ({
      회원명: (r.userId as { name?: string })?.name ?? "-",
      날짜: new Date(r.date).toLocaleDateString("ko-KR"),
      수업유형: r.classType ?? "-",
      상태: STATUS_LABELS[r.status] ?? r.status,
      체크방식: r.method === "qr" ? "QR" : "수동",
      메모: r.notes ?? "",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [14, 12, 14, 8, 10, 20].map((w) => ({ wch: w }));
    workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, ws, "출결 기록");

  } else if (type === "tuition") {
    const records = await Tuition.find()
      .populate("userId", "name")
      .sort({ dueDate: -1 })
      .limit(1000)
      .lean();

    const STATUS_LABELS: Record<string, string> = {
      pending: "미납", paid: "납부완료", overdue: "연체", cancelled: "취소",
    };

    const rows = records.map((r) => ({
      회원명: (r.userId as { name?: string })?.name ?? "-",
      설명: r.description ?? "-",
      금액: r.amount,
      납기일: new Date(r.dueDate).toLocaleDateString("ko-KR"),
      상태: STATUS_LABELS[r.status] ?? r.status,
      납부일: r.paidAt ? new Date(r.paidAt).toLocaleDateString("ko-KR") : "-",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [14, 20, 10, 12, 10, 12].map((w) => ({ wch: w }));
    workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, ws, "수강료 현황");

  } else if (type === "belt") {
    const records = await BeltRank.find()
      .populate("userId", "name")
      .sort({ examDate: -1 })
      .limit(1000)
      .lean();

    const BELT_LABELS: Record<string, string> = {
      white: "흰띠", yellow: "노란띠", orange: "주황띠", green: "초록띠",
      blue: "파란띠", purple: "보라띠", red: "빨간띠", brown: "갈색띠", black: "검정띠",
    };

    const rows = records.map((r) => ({
      회원명: (r.userId as { name?: string })?.name ?? "-",
      취득벨트: BELT_LABELS[r.belt] ?? r.belt,
      "벨트 레벨": r.beltLevel,
      심사일: new Date(r.examDate).toLocaleDateString("ko-KR"),
      결과: r.examResult === "pass" ? "합격" : r.examResult === "fail" ? "불합격" : "대기",
      심사관: r.examinerId ? String(r.examinerId) : "-",
      메모: r.notes ?? "",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [14, 10, 10, 12, 8, 14, 20].map((w) => ({ wch: w }));
    workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, ws, "승급 기록");

  } else {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  const fileName = encodeURIComponent(`${type}_${new Date().toISOString().slice(0, 10)}.xlsx`);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename*=UTF-8''${fileName}`,
    },
  });
}
