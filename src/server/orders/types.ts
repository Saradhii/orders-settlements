export type LineItem = {
  description: string;
  quantity: number;
  unitPriceCents: number;
};

export type OrderStatus = "pending" | "partially_paid" | "paid" | "overdue";

export type StatusInput = {
  paidCents: number;
  dueCents: number;
  dueDate: Date;
};

export const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "partially_paid",
  "paid",
  "overdue",
];
