import type { OrderDoc, PaymentDoc } from "@/server/db/collections";

import { deriveStatus } from "./domain";

export function toOrderResponse(order: OrderDoc, now = new Date()) {
  return {
    id: order._id.toString(),
    customer: order.customer,
    dueDate: order.dueDate.toISOString(),
    lineItems: order.lineItems,
    subtotalCents: order.subtotalCents,
    totalCents: order.totalCents,
    paidCents: order.paidCents,
    dueCents: order.dueCents,
    status: deriveStatus(order, now),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

export function toPaymentResponse(payment: PaymentDoc) {
  return {
    id: payment._id.toString(),
    orderId: payment.orderId.toString(),
    amountCents: payment.amountCents,
    paidAt: payment.paidAt.toISOString(),
    note: payment.note ?? null,
    createdAt: payment.createdAt.toISOString(),
  };
}

export type OrderResponse = ReturnType<typeof toOrderResponse>;
export type PaymentResponse = ReturnType<typeof toPaymentResponse>;
