import { ObjectId } from "mongodb";

import { ApiError } from "@/server/api/errors";
import { client } from "@/server/db/client";
import {
  orders,
  payments,
  type OrderDoc,
  type PaymentDoc,
} from "@/server/db/collections";

import { getOrder, notFound } from "./repository";
import type { RecordPaymentInput } from "./schema";

export async function listPayments(orderId: ObjectId) {
  return payments.find({ orderId }).sort({ createdAt: 1 }).toArray();
}

function overpayment(maxAllowedCents: number, attemptedCents: number) {
  const message =
    maxAllowedCents === 0
      ? "This order is already fully paid."
      : `That payment is more than the amount still due on this order.`;

  return new ApiError(409, "OVERPAYMENT", message, {
    maxAllowedCents,
    attemptedCents,
  });
}

export async function recordPayment(
  userId: string,
  id: string,
  input: RecordPaymentInput,
) {
  const existing = await getOrder(userId, id);
  const amountCents = input.amountCents;
  const now = new Date();

  const session = client.startSession();

  try {
    return await session.withTransaction(async () => {
      const order = await orders.findOneAndUpdate(
        { _id: existing._id, userId, dueCents: { $gte: amountCents } },
        {
          $inc: { paidCents: amountCents, dueCents: -amountCents },
          $set: { updatedAt: now },
        },
        { returnDocument: "after", session },
      );

      if (!order) {
        const current = await orders.findOne(
          { _id: existing._id, userId },
          { session },
        );

        if (!current) throw notFound();

        throw overpayment(current.dueCents, amountCents);
      }

      const payment: PaymentDoc = {
        _id: new ObjectId(),
        orderId: order._id,
        userId,
        amountCents,
        paidAt: input.paidAt ?? now,
        note: input.note,
        createdAt: now,
      };

      await payments.insertOne(payment, { session });

      return { order: order as OrderDoc, payment };
    });
  } finally {
    await session.endSession();
  }
}
