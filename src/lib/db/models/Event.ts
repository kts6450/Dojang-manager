import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IEvent extends Document {
  title: string;
  branchId?: Types.ObjectId;
  description?: string;
  type: "competition" | "seminar" | "exam" | "social" | "other";
  date: Date;
  endDate?: Date;
  location?: string;
  maxParticipants?: number;
  participants: Types.ObjectId[];
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  fee?: number;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", default: null },
    description: { type: String },
    type: {
      type: String,
      enum: ["competition", "seminar", "exam", "social", "other"],
      default: "other",
    },
    date: { type: Date, required: true },
    endDate: { type: Date },
    location: { type: String },
    maxParticipants: { type: Number },
    participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
    status: {
      type: String,
      enum: ["upcoming", "ongoing", "completed", "cancelled"],
      default: "upcoming",
    },
    fee: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

EventSchema.index({ date: 1, status: 1 });

const Event: Model<IEvent> =
  mongoose.models.Event || mongoose.model<IEvent>("Event", EventSchema);

export default Event;
