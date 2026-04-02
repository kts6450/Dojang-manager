import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type UserRole = "HQ_ADMIN" | "BRANCH_ADMIN" | "MEMBER" | "STUDENT";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: UserRole;
  branchId?: Types.ObjectId;
  status: "active" | "inactive" | "pending";
  belt?: string;
  beltLevel?: number;
  joinedAt: Date;
  birthDate?: Date;
  address?: string;
  emergencyContact?: string;
  profileImage?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    phone: { type: String },
    role: {
      type: String,
      enum: ["HQ_ADMIN", "BRANCH_ADMIN", "MEMBER", "STUDENT"],
      default: "MEMBER",
    },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", default: null },
    status: {
      type: String,
      enum: ["active", "inactive", "pending"],
      default: "active",
    },
    belt: { type: String, default: "white" },
    beltLevel: { type: Number, default: 1 },
    joinedAt: { type: Date, default: Date.now },
    birthDate: { type: Date },
    address: { type: String },
    emergencyContact: { type: String },
    profileImage: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
