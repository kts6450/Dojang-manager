import { z } from "zod";

export const memberCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional(),
  role: z.enum(["admin", "instructor", "member", "student"]).optional(),
  belt: z.string().optional(),
  beltLevel: z.coerce.number().int().positive().optional(),
  birthDate: z.coerce.date().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  notes: z.string().optional(),
});

export const memberUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  phone: z.string().optional(),
  role: z.enum(["admin", "instructor", "member", "student"]).optional(),
  status: z.enum(["active", "inactive", "pending"]).optional(),
  belt: z.string().optional(),
  beltLevel: z.coerce.number().int().positive().optional(),
  birthDate: z.coerce.date().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  profileImage: z.string().optional(),
  notes: z.string().optional(),
});

export type MemberCreate = z.infer<typeof memberCreateSchema>;
export type MemberUpdate = z.infer<typeof memberUpdateSchema>;
