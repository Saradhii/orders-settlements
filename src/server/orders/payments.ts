import { ObjectId, MongoServerError } from "mongodb";

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

function isDuplicateKey(error: unknown) {
  return error instanceof MongoServerError && error.code === 11000;
}

async function findReplay(
  orderId: ObjectId,
  idempotencyKey: string,
  amountCents: number,
) {
  const payment = await payments.findOne({ orderId, idempotencyKey });

  if (!payment) return null;

  if (payment.amountCents !== amountCents) {
    throw new ApiError(
      409,
      "IDEMPOTENCY_KEY_REUSED",
      "This Idempotency-Key was already used for a different amount. Use a new key.",
      { recordedAmountCents: payment.amountCents, attemptedCents: amountCents },
    );
  }

  const order = await orders.findOne({ _id: orderId });

  if (!order) throw notFound();

  return { order, payment, replayed: true };
}

export async function recordPayment(
  userId: string,
  id: string,
  input: RecordPaymentInput,
  idempotencyKey?: string,
) {
  const existing = await getOrder(userId, id);
  const amountCents = input.amountCents;
  const now = new Date();

  if (idempotencyKey) {
    const replay = await findReplay(existing._id, idempotencyKey, amountCents);

    if (replay) return replay;
  }

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
        idempotencyKey,
        createdAt: now,
      };

      await payments.insertOne(payment, { session });

      return { order: order as OrderDoc, payment, replayed: false };
    });
  } catch (error) {
    if (idempotencyKey && isDuplicateKey(error)) {
      const replay = await findReplay(existing._id, idempotencyKey, amountCents);

      if (replay) return replay;
    }

    throw error;
  } finally {
    await session.endSession();
  }
}
