import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db/connect";
import User from "@/lib/db/models/User";
import Branch from "@/lib/db/models/Branch";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production." }, { status: 403 });
  }

  await connectDB();

  const existing = await User.findOne({ email: "hq@dojang.com" });
  if (existing) {
    return NextResponse.json({ message: "Seed data already exists." });
  }

  const hashedPassword = await bcrypt.hash("admin1234", 12);

  // Create branches
  const [, seoulBranch, busanBranch] = await Branch.create([
    { name: "본사 직영점", code: "HQ", address: "서울시 강남구 테헤란로 123", phone: "02-1234-5678", managerName: "김관리" },
    { name: "서울 강남점", code: "SEOUL-GN", address: "서울시 강남구 역삼동 456", phone: "02-2345-6789", managerName: "이지점" },
    { name: "부산 해운대점", code: "BUSAN-HU", address: "부산시 해운대구 해운대로 789", phone: "051-3456-7890", managerName: "박지점" },
  ]);

  // Create users
  await User.create([
    // HQ Admin - no branchId (can see all)
    { name: "본사 관리자", email: "hq@dojang.com", password: hashedPassword, role: "HQ_ADMIN", status: "active", belt: "black", beltLevel: 9 },
    // Branch Admins
    { name: "강남점 관리자", email: "seoul@dojang.com", password: hashedPassword, role: "BRANCH_ADMIN", branchId: seoulBranch._id, status: "active", belt: "black", beltLevel: 4 },
    { name: "해운대점 관리자", email: "busan@dojang.com", password: hashedPassword, role: "BRANCH_ADMIN", branchId: busanBranch._id, status: "active", belt: "black", beltLevel: 4 },
    // Members - Seoul branch
    { name: "이회원", email: "member1@dojang.com", password: hashedPassword, role: "MEMBER", branchId: seoulBranch._id, status: "active", belt: "blue", beltLevel: 2 },
    { name: "박학생", email: "student1@dojang.com", password: hashedPassword, role: "STUDENT", branchId: seoulBranch._id, status: "active", belt: "yellow", beltLevel: 1 },
    // Members - Busan branch
    { name: "최회원", email: "member2@dojang.com", password: hashedPassword, role: "MEMBER", branchId: busanBranch._id, status: "active", belt: "orange", beltLevel: 1 },
    { name: "정학생", email: "student2@dojang.com", password: hashedPassword, role: "STUDENT", branchId: busanBranch._id, status: "active", belt: "white", beltLevel: 1 },
  ]);

  return NextResponse.json({
    message: "시드 데이터가 생성되었습니다.",
    branches: [
      { name: "본사 직영점", code: "HQ" },
      { name: "서울 강남점", code: "SEOUL-GN" },
      { name: "부산 해운대점", code: "BUSAN-HU" },
    ],
    accounts: [
      { email: "hq@dojang.com", password: "admin1234", role: "HQ_ADMIN", desc: "모든 지점 조회 가능" },
      { email: "seoul@dojang.com", password: "admin1234", role: "BRANCH_ADMIN", desc: "서울 강남점만 조회" },
      { email: "busan@dojang.com", password: "admin1234", role: "BRANCH_ADMIN", desc: "부산 해운대점만 조회" },
      { email: "member1@dojang.com", password: "admin1234", role: "MEMBER", desc: "회원 포털용" },
      { email: "student1@dojang.com", password: "admin1234", role: "STUDENT", desc: "회원 포털용" },
    ],
  });
}
