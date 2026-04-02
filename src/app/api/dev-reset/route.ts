import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db/connect";
import User from "@/lib/db/models/User";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production." }, { status: 403 });
  }

  await connectDB();

  const hash = await bcrypt.hash("admin1234", 12);

  const defaultUsers = [
    { email: "hq@dojang.com", name: "본사 관리자", role: "HQ_ADMIN", belt: "black", beltLevel: 9 },
    { email: "seoul@dojang.com", name: "강남점 관리자", role: "BRANCH_ADMIN", belt: "black", beltLevel: 4 },
    { email: "busan@dojang.com", name: "해운대점 관리자", role: "BRANCH_ADMIN", belt: "black", beltLevel: 4 },
    { email: "member1@dojang.com", name: "이회원", role: "MEMBER", belt: "blue", beltLevel: 2 },
    { email: "student1@dojang.com", name: "박학생", role: "STUDENT", belt: "yellow", beltLevel: 1 },
  ];

  const results = [];
  for (const u of defaultUsers) {
    await User.findOneAndUpdate(
      { email: u.email },
      { $set: { ...u, password: hash, status: "active" } },
      { upsert: true, new: true }
    );
    results.push({ email: u.email, role: u.role });
  }

  return NextResponse.json({ message: "All accounts reset to admin1234", accounts: results });
}
