import { z } from "zod";
import { objectIdSchema } from "./common";

export const beltRankCreateSchema = z.object({
  userId: objectIdSchema,
  belt: z.string().min(1, "Belt color is required"),
  examDate: z.coerce.date(),
  beltLevel: z.coerce.number().int().positive().optional(),
  examResult: z.enum(["pass", "fail", "pending"]).optional(),
  examScore: z.coerce.number().min(0).max(100).optional(),
  notes: z.string().optional(),
});

export type BeltRankCreate = z.infer<typeof beltRankCreateSchema>;
