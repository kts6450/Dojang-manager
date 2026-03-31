import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db/connect";
import User from "@/lib/db/models/User";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production." }, { status: 403 });
  }

  await connectDB();

  const existing = await User.findOne({ email: "admin@dojang.com" });
  if (existing) {
    return NextResponse.json({ message: "Seed data already exists." });
  }

  const hashedPassword = await bcrypt.hash("admin1234", 12);

  await User.create([
    { name: "Administrator", email: "admin@dojang.com", password: hashedPassword, role: "admin", status: "active", belt: "black", beltLevel: 9 },
    { name: "Kim Taekwon", email: "taekwon@dojang.com", password: hashedPassword, role: "instructor", status: "active", belt: "black", beltLevel: 4 },
    { name: "Lee Member", email: "member1@dojang.com", password: hashedPassword, role: "member", status: "active", belt: "blue", beltLevel: 2 },
    { name: "Park Student", email: "student1@dojang.com", password: hashedPassword, role: "student", status: "active", belt: "yellow", beltLevel: 1 },
    { name: "Choi Student", email: "student2@dojang.com", password: hashedPassword, role: "student", status: "active", belt: "orange", beltLevel: 1 },
  ]);

  return NextResponse.json({
    message: "Seed data has been created.",
    accounts: [
      { email: "admin@dojang.com", password: "admin1234", role: "Administrator" },
      { email: "taekwon@dojang.com", password: "admin1234", role: "Instructor" },
    ],
  });
}
