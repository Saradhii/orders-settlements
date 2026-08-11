import type { LineItem, OrderStatus, StatusInput } from "./types";

export function subtotalCents(lineItems: LineItem[]) {
  return lineItems.reduce(
    (total, item) => total + item.quantity * item.unitPriceCents,
    0,
  );
}

export function deriveStatus(order: StatusInput, now: Date): OrderStatus {
  if (order.dueCents === 0) return "paid";
  if (order.dueDate < now) return "overdue";

  return order.paidCents === 0 ? "pending" : "partially_paid";
}

export function statusFilter(status: OrderStatus, now: Date) {
  if (status === "paid") return { dueCents: 0 };
  if (status === "overdue") {
    return { dueCents: { $gt: 0 }, dueDate: { $lt: now } };
  }

  const unpaidAndNotYetDue = { dueCents: { $gt: 0 }, dueDate: { $gte: now } };

  return status === "pending"
    ? { ...unpaidAndNotYetDue, paidCents: 0 }
    : { ...unpaidAndNotYetDue, paidCents: { $gt: 0 } };
}
