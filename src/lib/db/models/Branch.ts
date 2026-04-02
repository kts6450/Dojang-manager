import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBranch extends Document {
  name: string;
  code: string;
  address?: string;
  phone?: string;
  managerName?: string;
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}

const BranchSchema = new Schema<IBranch>(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    address: { type: String },
    phone: { type: String },
    managerName: { type: String },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

const Branch: Model<IBranch> =
  mongoose.models.Branch || mongoose.model<IBranch>("Branch", BranchSchema);

export default Branch;
