import { z } from "zod";
import { objectIdSchema } from "./common";

export const tuitionCreateSchema = z.object({
  userId: objectIdSchema,
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  dueDate: z.coerce.date(),
  description: z.string().optional(),
  notes: z.string().optional(),
});

export const tuitionUpdateSchema = z.object({
  status: z.enum(["pending", "paid", "overdue", "cancelled"]).optional(),
  paymentMethod: z.string().optional(),
  paidAt: z.coerce.date().optional(),
  notes: z.string().optional(),
});

export type TuitionCreate = z.infer<typeof tuitionCreateSchema>;
export type TuitionUpdate = z.infer<typeof tuitionUpdateSchema>;
