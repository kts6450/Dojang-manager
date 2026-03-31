import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ITuition extends Document {
  userId: Types.ObjectId;
  amount: number;
  description: string;
  dueDate: Date;
  paidAt?: Date;
  status: "pending" | "paid" | "overdue" | "cancelled";
  paymentMethod?: string;
  receiptNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TuitionSchema = new Schema<ITuition>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    description: { type: String, required: true },
    dueDate: { type: Date, required: true },
    paidAt: { type: Date },
    status: {
      type: String,
      enum: ["pending", "paid", "overdue", "cancelled"],
      default: "pending",
    },
    paymentMethod: { type: String },
    receiptNumber: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

TuitionSchema.index({ userId: 1, status: 1 });

const Tuition: Model<ITuition> =
  mongoose.models.Tuition ||
  mongoose.model<ITuition>("Tuition", TuitionSchema);

export default Tuition;
