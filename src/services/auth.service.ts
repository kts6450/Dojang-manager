import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db/connect";
import User from "@/lib/db/models/User";
import type { RegisterInput } from "@/lib/validations/register";

export async function registerUser(data: RegisterInput) {
  await connectDB();

  const existing = await User.findOne({ email: data.email });
  if (existing) {
    throw Object.assign(new Error("This email is already registered."), { statusCode: 409 });
  }

  const hashedPassword = await bcrypt.hash(data.password, 12);
  const user = await User.create({
    name: data.name,
    email: data.email,
    password: hashedPassword,
    role: "member",
    phone: data.phone,
  });

  return { message: "Member registered successfully.", id: user._id };
}
