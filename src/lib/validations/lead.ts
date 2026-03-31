import { z } from "zod";

export const leadCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  source: z
    .enum(["walk-in", "referral", "sns", "website", "event", "other"])
    .optional(),
  interest: z.string().optional(),
  notes: z.string().optional(),
});

export type LeadCreate = z.infer<typeof leadCreateSchema>;
