import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IInventoryItem extends Document {
  branchId?: Types.ObjectId;
  name: string;
  category: "uniform" | "equipment" | "book" | "merchandise" | "other";
  quantity: number;
  minQuantity: number;
  price: number;
  supplier?: string;
  sku?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IInventoryLog extends Document {
  itemId: mongoose.Types.ObjectId;
  type: "in" | "out" | "adjustment";
  quantity: number;
  reason?: string;
  date: Date;
  createdAt: Date;
}

const InventoryItemSchema = new Schema<IInventoryItem>(
  {
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", default: null },
    name: { type: String, required: true },
    category: {
      type: String,
      enum: ["uniform", "equipment", "book", "merchandise", "other"],
      default: "other",
    },
    quantity: { type: Number, required: true, default: 0 },
    minQuantity: { type: Number, default: 0 },
    price: { type: Number, required: true, default: 0 },
    supplier: { type: String },
    sku: { type: String },
    description: { type: String },
  },
  { timestamps: true }
);

const InventoryLogSchema = new Schema<IInventoryLog>(
  {
    itemId: {
      type: Schema.Types.ObjectId,
      ref: "InventoryItem",
      required: true,
    },
    type: { type: String, enum: ["in", "out", "adjustment"], required: true },
    quantity: { type: Number, required: true },
    reason: { type: String },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const InventoryItem: Model<IInventoryItem> =
  mongoose.models.InventoryItem ||
  mongoose.model<IInventoryItem>("InventoryItem", InventoryItemSchema);

export const InventoryLog: Model<IInventoryLog> =
  mongoose.models.InventoryLog ||
  mongoose.model<IInventoryLog>("InventoryLog", InventoryLogSchema);
