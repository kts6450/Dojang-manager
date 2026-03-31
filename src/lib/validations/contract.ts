import { z } from "zod";
import { objectIdSchema } from "./common";

export const contractCreateSchema = z.object({
  userId: objectIdSchema,
  title: z.string().min(1, "Title is required"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  terms: z.string().optional(),
  amount: z.coerce.number().optional(),
  notes: z.string().optional(),
});

export type ContractCreate = z.infer<typeof contractCreateSchema>;
