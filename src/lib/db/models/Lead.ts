import mongoose, { Schema, Document, Model } from "mongoose";

export interface ILead extends Document {
  name: string;
  email?: string;
  phone?: string;
  source: "walk-in" | "referral" | "sns" | "website" | "event" | "other";
  status: "new" | "contacted" | "trial" | "converted" | "lost";
  interestedIn?: string;
  trialDate?: Date;
  notes?: string;
  assignedTo?: string;
  followUpDate?: Date;
  convertedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema = new Schema<ILead>(
  {
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    source: {
      type: String,
      enum: ["walk-in", "referral", "sns", "website", "event", "other"],
      default: "other",
    },
    status: {
      type: String,
      enum: ["new", "contacted", "trial", "converted", "lost"],
      default: "new",
    },
    interestedIn: { type: String },
    trialDate: { type: Date },
    notes: { type: String },
    assignedTo: { type: String },
    followUpDate: { type: Date },
    convertedAt: { type: Date },
  },
  { timestamps: true }
);

LeadSchema.index({ status: 1, createdAt: -1 });

const Lead: Model<ILead> =
  mongoose.models.Lead || mongoose.model<ILead>("Lead", LeadSchema);

export default Lead;
