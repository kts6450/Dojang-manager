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

  const hashedPassword = await bcrypt.hash("admin1234", 12);

  // Upsert branches
  const [, seoulBranch, busanBranch] = await Promise.all([
    Branch.findOneAndUpdate(
      { code: "HQ" },
      { name: "본사 직영점", code: "HQ", address: "서울시 강남구 테헤란로 123", phone: "02-1234-5678", managerName: "김관리", status: "active" },
      { upsert: true, new: true }
    ),
    Branch.findOneAndUpdate(
      { code: "SEOUL-GN" },
      { name: "서울 강남점", code: "SEOUL-GN", address: "서울시 강남구 역삼동 456", phone: "02-2345-6789", managerName: "이지점", status: "active" },
      { upsert: true, new: true }
    ),
    Branch.findOneAndUpdate(
      { code: "BUSAN-HU" },
      { name: "부산 해운대점", code: "BUSAN-HU", address: "부산시 해운대구 해운대로 789", phone: "051-3456-7890", managerName: "박지점", status: "active" },
      { upsert: true, new: true }
    ),
  ]);

  // Upsert all users (handles existing data from old seed)
  const users = [
    { email: "hq@dojang.com", name: "본사 관리자", role: "HQ_ADMIN", branchId: null, belt: "black", beltLevel: 9 },
    { email: "seoul@dojang.com", name: "강남점 관리자", role: "BRANCH_ADMIN", branchId: seoulBranch?._id, belt: "black", beltLevel: 4 },
    { email: "busan@dojang.com", name: "해운대점 관리자", role: "BRANCH_ADMIN", branchId: busanBranch?._id, belt: "black", beltLevel: 4 },
    { email: "member1@dojang.com", name: "이회원", role: "MEMBER", branchId: seoulBranch?._id, belt: "blue", beltLevel: 2 },
    { email: "student1@dojang.com", name: "박학생", role: "STUDENT", branchId: seoulBranch?._id, belt: "yellow", beltLevel: 1 },
    { email: "member2@dojang.com", name: "최회원", role: "MEMBER", branchId: busanBranch?._id, belt: "orange", beltLevel: 1 },
    { email: "student2@dojang.com", name: "정학생", role: "STUDENT", branchId: busanBranch?._id, belt: "white", beltLevel: 1 },
  ];

  for (const u of users) {
    await User.findOneAndUpdate(
      { email: u.email },
      { $set: { ...u, password: hashedPassword, status: "active" } },
      { upsert: true, new: true }
    );
  }

  return NextResponse.json({
    message: "시드 데이터가 생성/업데이트되었습니다.",
    accounts: [
      { email: "hq@dojang.com", password: "admin1234", role: "HQ_ADMIN", desc: "모든 지점 조회 가능" },
      { email: "seoul@dojang.com", password: "admin1234", role: "BRANCH_ADMIN", desc: "서울 강남점만 조회" },
      { email: "busan@dojang.com", password: "admin1234", role: "BRANCH_ADMIN", desc: "부산 해운대점만 조회" },
      { email: "member1@dojang.com", password: "admin1234", role: "MEMBER", desc: "회원 포털용" },
      { email: "student1@dojang.com", password: "admin1234", role: "STUDENT", desc: "회원 포털용" },
    ],
  });
}
