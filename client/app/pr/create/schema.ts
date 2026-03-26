import { z } from 'zod';

export const PrItemSchema = z.object({
  productDesc: z.string().min(1, 'Product description is required'),
  qty: z.coerce.number().min(1, 'Quantity must be at least 1'),
  estimatedPrice: z.coerce.number().min(0, 'Price must be non-negative'),
  unit: z.string().optional(),
  specNote: z.string().optional(),
});

export const CreatePrSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  requiredDate: z.string().optional(), // ISO string from date picker
  priority: z.coerce.number().min(1).max(3).default(2),
  costCenterId: z.string().optional(),
  items: z.array(PrItemSchema).min(1, 'At least one item is required'),
});

export type CreatePrFormValues = z.infer<typeof CreatePrSchema>;
