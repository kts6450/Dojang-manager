import { z } from "zod";

export const inventoryCreateSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  category: z
    .enum(["uniform", "equipment", "book", "merchandise", "other"])
    .optional(),
  quantity: z.coerce.number().int().min(0).optional(),
  minQuantity: z.coerce.number().int().min(0).optional(),
  price: z.coerce.number().min(0).optional(),
  supplier: z.string().optional(),
  sku: z.string().optional(),
  description: z.string().optional(),
});

export type InventoryCreate = z.infer<typeof inventoryCreateSchema>;
