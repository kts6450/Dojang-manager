import { z } from "zod";
import { objectIdSchema } from "./common";

const platformEnum = z.enum(["zoom", "meet", "teams", "youtube", "other"]);
const statusEnum = z.enum(["scheduled", "ongoing", "completed", "cancelled"]);

export const onlineClassCreateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  meetingUrl: z.string().min(1, "Meeting URL is required"),
  scheduledAt: z.coerce.date(),
  description: z.string().optional(),
  instructor: objectIdSchema.optional(),
  platform: platformEnum.optional(),
  meetingId: z.string().optional(),
  passcode: z.string().optional(),
  duration: z.coerce.number().int().positive("Duration must be a positive integer").optional(),
  status: statusEnum.optional(),
  participants: z.array(objectIdSchema).optional(),
  recordingUrl: z.string().optional(),
  notes: z.string().optional(),
});

export const onlineClassUpdateSchema = z.object({
  title: z.string().min(1, "Title cannot be empty").optional(),
  description: z.string().optional(),
  instructor: objectIdSchema.optional(),
  platform: platformEnum.optional(),
  meetingUrl: z.string().min(1, "Meeting URL cannot be empty").optional(),
  meetingId: z.string().optional(),
  passcode: z.string().optional(),
  scheduledAt: z.coerce.date().optional(),
  duration: z.coerce.number().int().positive("Duration must be a positive integer").optional(),
  status: statusEnum.optional(),
  participants: z.array(objectIdSchema).optional(),
  recordingUrl: z.string().optional(),
  notes: z.string().optional(),
});

export type OnlineClassCreate = z.infer<typeof onlineClassCreateSchema>;
export type OnlineClassUpdate = z.infer<typeof onlineClassUpdateSchema>;
