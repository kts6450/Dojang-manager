import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IBeltRank extends Document {
  userId: Types.ObjectId;
  belt: string;
  beltLevel: number;
  previousBelt?: string;
  promotedAt: Date;
  examDate: Date;
  examResult: "pass" | "fail" | "pending";
  examScore?: number;
  examinerId?: Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BeltRankSchema = new Schema<IBeltRank>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    belt: { type: String, required: true },
    beltLevel: { type: Number, required: true },
    previousBelt: { type: String },
    promotedAt: { type: Date },
    examDate: { type: Date, required: true },
    examResult: {
      type: String,
      enum: ["pass", "fail", "pending"],
      default: "pending",
    },
    examScore: { type: Number },
    examinerId: { type: Schema.Types.ObjectId, ref: "User" },
    notes: { type: String },
  },
  { timestamps: true }
);

BeltRankSchema.index({ userId: 1, examDate: -1 });

const BeltRank: Model<IBeltRank> =
  mongoose.models.BeltRank ||
  mongoose.model<IBeltRank>("BeltRank", BeltRankSchema);

export default BeltRank;
