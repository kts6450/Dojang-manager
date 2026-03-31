import { connectDB } from "@/lib/db/connect";
import Event from "@/lib/db/models/Event";

interface ListEventsQuery {
  status?: string;
}

export async function listEvents({ status }: ListEventsQuery) {
  await connectDB();

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;

  const events = await Event.find(filter)
    .populate("createdBy", "name")
    .populate("participants", "name")
    .sort({ date: 1 })
    .lean();

  return events;
}

interface CreateEventData {
  title: string;
  description?: string;
  type?: string;
  date: string | Date;
  endDate?: string | Date;
  location?: string;
  maxParticipants?: number;
  fee?: number;
  createdBy: string;
}

export async function createEvent(data: CreateEventData) {
  await connectDB();

  const { title, description, type, date, endDate, location, maxParticipants, fee, createdBy } = data;

  if (!title || !date) {
    throw Object.assign(new Error("Title and date are required."), { statusCode: 400 });
  }

  const event = await Event.create({
    title, description, type: type || "other",
    date: new Date(date), endDate: endDate ? new Date(endDate) : undefined,
    location, maxParticipants, fee: fee || 0,
    createdBy,
  });

  return event;
}

export async function getEvent(id: string) {
  await connectDB();

  const event = await Event.findById(id)
    .populate("createdBy", "name")
    .populate("participants", "name")
    .lean();

  if (!event) {
    throw Object.assign(new Error("Event not found."), { statusCode: 404 });
  }
  return event;
}

export async function updateEvent(id: string, data: Record<string, unknown>) {
  await connectDB();

  const event = await Event.findByIdAndUpdate(id, data, { new: true });
  if (!event) {
    throw Object.assign(new Error("Event not found."), { statusCode: 404 });
  }
  return event;
}

export async function deleteEvent(id: string) {
  await connectDB();

  const event = await Event.findByIdAndDelete(id);
  if (!event) {
    throw Object.assign(new Error("Event not found."), { statusCode: 404 });
  }
  return { message: "Deleted." };
}
