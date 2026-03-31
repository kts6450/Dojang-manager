import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db/connect";
import User from "@/lib/db/models/User";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "프로덕션에서는 사용할 수 없습니다." }, { status: 403 });
  }

  await connectDB();

  const existing = await User.findOne({ email: "admin@dojang.com" });
  if (existing) {
    return NextResponse.json({ message: "이미 초기 데이터가 있습니다." });
  }

  const hashedPassword = await bcrypt.hash("admin1234", 12);

  await User.create([
    { name: "관리자", email: "admin@dojang.com", password: hashedPassword, role: "admin", status: "active", belt: "black", beltLevel: 9 },
    { name: "김태권", email: "taekwon@dojang.com", password: hashedPassword, role: "instructor", status: "active", belt: "black", beltLevel: 4 },
    { name: "이회원", email: "member1@dojang.com", password: hashedPassword, role: "member", status: "active", belt: "blue", beltLevel: 2 },
    { name: "박학생", email: "student1@dojang.com", password: hashedPassword, role: "student", status: "active", belt: "yellow", beltLevel: 1 },
    { name: "최수련", email: "student2@dojang.com", password: hashedPassword, role: "student", status: "active", belt: "orange", beltLevel: 1 },
  ]);

  return NextResponse.json({
    message: "초기 데이터가 생성됐습니다.",
    accounts: [
      { email: "admin@dojang.com", password: "admin1234", role: "관리자" },
      { email: "taekwon@dojang.com", password: "admin1234", role: "강사" },
    ],
  });
}
