import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IAttendance extends Document {
  userId: Types.ObjectId;
  classType: string;
  date: Date;
  checkInTime?: Date;
  checkOutTime?: Date;
  status: "present" | "absent" | "late" | "excused";
  method: "manual" | "qr";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    classType: { type: String, required: true },
    date: { type: Date, required: true },
    checkInTime: { type: Date },
    checkOutTime: { type: Date },
    status: {
      type: String,
      enum: ["present", "absent", "late", "excused"],
      default: "present",
    },
    method: { type: String, enum: ["manual", "qr"], default: "manual" },
    notes: { type: String },
  },
  { timestamps: true }
);

AttendanceSchema.index({ userId: 1, date: 1 });

const Attendance: Model<IAttendance> =
  mongoose.models.Attendance ||
  mongoose.model<IAttendance>("Attendance", AttendanceSchema);

export default Attendance;
