import { z } from "zod";
import { objectIdSchema } from "./common";

const scheduleSchema = z.object({
  dayOfWeek: z.array(z.coerce.number().int()).optional(),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
});

export const afterSchoolCreateSchema = z.object({
  studentId: objectIdSchema,
  programName: z.string().min(1, "Program name is required"),
  startDate: z.coerce.date(),
  schedule: scheduleSchema.optional(),
  endDate: z.coerce.date().optional(),
  status: z.enum(["active", "inactive", "completed"]).optional(),
  tuitionAmount: z.coerce.number().optional(),
  notes: z.string().optional(),
});

export const afterSchoolUpdateSchema = z.object({
  studentId: objectIdSchema.optional(),
  programName: z.string().min(1, "Program name cannot be empty").optional(),
  schedule: scheduleSchema.partial().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  status: z.enum(["active", "inactive", "completed"]).optional(),
  tuitionAmount: z.coerce.number().optional(),
  notes: z.string().optional(),
});

export type AfterSchoolCreate = z.infer<typeof afterSchoolCreateSchema>;
export type AfterSchoolUpdate = z.infer<typeof afterSchoolUpdateSchema>;
