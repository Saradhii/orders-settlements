export type LineItem = {
  description: string;
  quantity: number;
  unitPriceCents: number;
};

export const ORDER_STATUSES = [
  "pending",
  "partially_paid",
  "paid",
  "overdue",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type StatusInput = {
  paidCents: number;
  dueCents: number;
  dueDate: Date;
};
