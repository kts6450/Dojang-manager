import { z } from "zod";
import { objectIdSchema } from "./common";

export const attendanceCreateSchema = z.object({
  userId: objectIdSchema,
  classType: z.string().min(1, "Class type is required"),
  date: z.coerce.date(),
  checkInTime: z.coerce.date().optional(),
  checkOutTime: z.coerce.date().optional(),
  status: z.enum(["present", "absent", "late", "excused"]).optional(),
  method: z.enum(["manual", "qr"]).optional(),
  notes: z.string().optional(),
});

export type AttendanceCreate = z.infer<typeof attendanceCreateSchema>;
