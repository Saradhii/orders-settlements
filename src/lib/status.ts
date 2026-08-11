import type { OrderStatus } from "@/server/orders/types";

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  partially_paid: "Partially paid",
  paid: "Paid",
  overdue: "Overdue",
};

export const STATUS_VARIANTS: Record<
  OrderStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "outline",
  partially_paid: "secondary",
  paid: "default",
  overdue: "destructive",
};
