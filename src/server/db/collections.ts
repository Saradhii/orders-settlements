import type { ObjectId } from "mongodb";

import type { LineItem } from "@/server/orders/types";

import { db } from "./client";

export type OrderDoc = {
  _id: ObjectId;
  userId: string;
  customer: string;
  dueDate: Date;
  lineItems: LineItem[];
  subtotalCents: number;
  totalCents: number;
  paidCents: number;
  dueCents: number;
  createdAt: Date;
  updatedAt: Date;
};

export type PaymentDoc = {
  _id: ObjectId;
  orderId: ObjectId;
  userId: string;
  amountCents: number;
  paidAt: Date;
  note?: string;
  createdAt: Date;
};

export const orders = db.collection<OrderDoc>("orders");
export const payments = db.collection<PaymentDoc>("payments");
