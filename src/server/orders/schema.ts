import { z } from "zod";

import { ORDER_STATUSES } from "./types";

const dueDate = z
  .union([z.string(), z.date()], { error: "Due date is required." })
  .pipe(
    z.coerce.date({
      error: "Due date must be a valid date, for example 2026-09-01.",
    }),
  );

export const lineItemSchema = z.object({
  description: z
    .string({ error: "Every line item needs a description." })
    .trim()
    .min(1, "Every line item needs a description.")
    .max(200, "Keep descriptions under 200 characters."),
  quantity: z
    .number({ error: "Quantity is required." })
    .int("Quantity must be a whole number.")
    .min(1, "Quantity must be at least 1."),
  unitPriceCents: z
    .number({ error: "Unit price is required." })
    .int("Unit price must be a whole number of cents.")
    .min(0, "Unit price cannot be negative."),
});

export const createOrderSchema = z.object({
  customer: z
    .string({ error: "Customer name is required." })
    .trim()
    .min(1, "Customer name is required.")
    .max(200, "Keep customer names under 200 characters."),
  dueDate,
  lineItems: z
    .array(lineItemSchema, { error: "Line items are required." })
    .min(1, "Add at least one line item.")
    .max(100, "An order cannot have more than 100 line items."),
});

export const updateOrderSchema = createOrderSchema
  .partial()
  .refine((input) => Object.keys(input).length > 0, {
    message: "Provide at least one field to update.",
  });

export const recordPaymentSchema = z.object({
  amountCents: z
    .number({ error: "Payment amount is required." })
    .int("Payment amount must be a whole number of cents.")
    .min(1, "Payment amount must be at least 1 cent."),
  paidAt: z.coerce
    .date({ error: "Payment date must be a valid date." })
    .optional(),
  note: z.string().trim().max(500, "Keep notes under 500 characters.").optional(),
});

export const listOrdersQuerySchema = z.object({
  status: z.enum(ORDER_STATUSES, {
    error: `Status must be one of: ${ORDER_STATUSES.join(", ")}.`,
  }).optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
