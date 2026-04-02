import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IOnlineClass extends Document {
  branchId?: Types.ObjectId;
  title: string;
  description?: string;
  instructor: Types.ObjectId;
  platform: "zoom" | "meet" | "teams" | "youtube" | "other";
  meetingUrl: string;
  meetingId?: string;
  passcode?: string;
  scheduledAt: Date;
  duration: number;
  status: "scheduled" | "ongoing" | "completed" | "cancelled";
  participants: Types.ObjectId[];
  recordingUrl?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OnlineClassSchema = new Schema<IOnlineClass>(
  {
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", default: null },
    title: { type: String, required: true },
    description: { type: String },
    instructor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    platform: {
      type: String,
      enum: ["zoom", "meet", "teams", "youtube", "other"],
      default: "zoom",
    },
    meetingUrl: { type: String, required: true },
    meetingId: { type: String },
    passcode: { type: String },
    scheduledAt: { type: Date, required: true },
    duration: { type: Number, default: 60 },
    status: {
      type: String,
      enum: ["scheduled", "ongoing", "completed", "cancelled"],
      default: "scheduled",
    },
    participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
    recordingUrl: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

OnlineClassSchema.index({ scheduledAt: 1, status: 1 });

const OnlineClass: Model<IOnlineClass> =
  mongoose.models.OnlineClass ||
  mongoose.model<IOnlineClass>("OnlineClass", OnlineClassSchema);

export default OnlineClass;
