import { z } from "zod";

export const eventCreateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  date: z.coerce.date(),
  description: z.string().optional(),
  type: z
    .enum(["competition", "seminar", "exam", "social", "other"])
    .optional(),
  endDate: z.coerce.date().optional(),
  location: z.string().optional(),
  maxParticipants: z.coerce.number().int().positive().optional(),
  fee: z.coerce.number().min(0).optional(),
});

export type EventCreate = z.infer<typeof eventCreateSchema>;
