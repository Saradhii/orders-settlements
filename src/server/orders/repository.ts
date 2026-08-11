import { ObjectId } from "mongodb";

import { ApiError } from "@/server/api/errors";
import { orders, type OrderDoc } from "@/server/db/collections";

import { statusFilter, subtotalCents } from "./domain";
import type { CreateOrderInput, UpdateOrderInput } from "./schema";
import type { OrderStatus } from "./types";

export function notFound() {
  return new ApiError(404, "ORDER_NOT_FOUND", "That order does not exist.");
}

function toObjectId(id: string) {
  if (!ObjectId.isValid(id)) throw notFound();

  return new ObjectId(id);
}

export async function listOrders(userId: string, status?: OrderStatus) {
  const filter = status
    ? { userId, ...statusFilter(status, new Date()) }
    : { userId };

  return orders.find(filter).sort({ dueDate: 1 }).toArray();
}

export async function getOrder(userId: string, id: string) {
  const order = await orders.findOne({ _id: toObjectId(id), userId });

  if (!order) throw notFound();

  return order;
}

export async function createOrder(userId: string, input: CreateOrderInput) {
  const subtotal = subtotalCents(input.lineItems);
  const now = new Date();

  const order: OrderDoc = {
    _id: new ObjectId(),
    userId,
    customer: input.customer,
    dueDate: input.dueDate,
    lineItems: input.lineItems,
    subtotalCents: subtotal,
    totalCents: subtotal,
    paidCents: 0,
    dueCents: subtotal,
    createdAt: now,
    updatedAt: now,
  };

  await orders.insertOne(order);

  return order;
}

export async function updateOrder(
  userId: string,
  id: string,
  input: UpdateOrderInput,
) {
  const existing = await getOrder(userId, id);
  const changes: Partial<OrderDoc> = { updatedAt: new Date() };

  if (input.customer !== undefined) changes.customer = input.customer;
  if (input.dueDate !== undefined) changes.dueDate = input.dueDate;

  if (input.lineItems) {
    const subtotal = subtotalCents(input.lineItems);

    if (subtotal < existing.paidCents) {
      throw new ApiError(
        409,
        "TOTAL_BELOW_PAID",
        "This order already has more paid against it than the new total.",
        {
          paidCents: existing.paidCents,
          requestedTotalCents: subtotal,
          minimumTotalCents: existing.paidCents,
        },
      );
    }

    changes.lineItems = input.lineItems;
    changes.subtotalCents = subtotal;
    changes.totalCents = subtotal;
    changes.dueCents = subtotal - existing.paidCents;
  }

  const updated = await orders.findOneAndUpdate(
    { _id: existing._id, userId, paidCents: existing.paidCents },
    { $set: changes },
    { returnDocument: "after" },
  );

  if (!updated) {
    throw new ApiError(
      409,
      "ORDER_CHANGED",
      "A payment was recorded while you were editing. Reload and try again.",
    );
  }

  return updated;
}

export async function deleteOrder(userId: string, id: string) {
  const existing = await getOrder(userId, id);

  if (existing.paidCents > 0) {
    throw new ApiError(
      409,
      "ORDER_HAS_PAYMENTS",
      "Orders with recorded payments cannot be deleted.",
      { paidCents: existing.paidCents },
    );
  }

  const result = await orders.deleteOne({
    _id: existing._id,
    userId,
    paidCents: 0,
  });

  if (result.deletedCount === 0) {
    throw new ApiError(
      409,
      "ORDER_CHANGED",
      "A payment was recorded while you were deleting. Reload and try again.",
    );
  }
}
