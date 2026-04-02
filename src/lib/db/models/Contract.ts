import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IContract extends Document {
  userId: Types.ObjectId;
  branchId?: Types.ObjectId;
  title: string;
  terms: string;
  startDate: Date;
  endDate: Date;
  amount: number;
  signedAt?: Date;
  status: "draft" | "pending" | "signed" | "expired" | "cancelled";
  signatureData?: string;
  pdfUrl?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ContractSchema = new Schema<IContract>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", default: null },
    title: { type: String, required: true },
    terms: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    amount: { type: Number, required: true },
    signedAt: { type: Date },
    status: {
      type: String,
      enum: ["draft", "pending", "signed", "expired", "cancelled"],
      default: "draft",
    },
    signatureData: { type: String },
    pdfUrl: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

ContractSchema.index({ userId: 1, status: 1 });
ContractSchema.index({ endDate: 1, status: 1 });

const Contract: Model<IContract> =
  mongoose.models.Contract ||
  mongoose.model<IContract>("Contract", ContractSchema);

export default Contract;
