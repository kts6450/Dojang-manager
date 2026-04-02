import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IAfterSchool extends Document {
  studentId: Types.ObjectId;
  branchId?: Types.ObjectId;
  programName: string;
  schedule: {
    dayOfWeek: number[];
    startTime: string;
    endTime: string;
  };
  startDate: Date;
  endDate?: Date;
  status: "active" | "inactive" | "completed";
  tuitionAmount?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AfterSchoolSchema = new Schema<IAfterSchool>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", default: null },
    programName: { type: String, required: true },
    schedule: {
      dayOfWeek: [{ type: Number }],
      startTime: { type: String, required: true },
      endTime: { type: String, required: true },
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    status: {
      type: String,
      enum: ["active", "inactive", "completed"],
      default: "active",
    },
    tuitionAmount: { type: Number },
    notes: { type: String },
  },
  { timestamps: true }
);

const AfterSchool: Model<IAfterSchool> =
  mongoose.models.AfterSchool ||
  mongoose.model<IAfterSchool>("AfterSchool", AfterSchoolSchema);

export default AfterSchool;
