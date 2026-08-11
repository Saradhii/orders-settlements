import { ObjectId } from "mongodb";

import { auth } from "@/lib/auth";
import { client, db } from "@/server/db/client";
import {
  orders,
  payments,
  type OrderDoc,
  type PaymentDoc,
} from "@/server/db/collections";
import { ensureIndexes } from "@/server/db/indexes";
import { subtotalCents } from "@/server/orders/domain";

import { DEMO, SEED_ORDERS } from "./seed-data";

function addDays(base: Date, days: number) {
  return new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
}

async function clearOrders(userId: string) {
  const existing = await orders
    .find({ userId }, { projection: { _id: 1 } })
    .toArray();

  await payments.deleteMany({ orderId: { $in: existing.map((o) => o._id) } });
  await orders.deleteMany({ userId });
}

async function resetDemoUser() {
  const users = db.collection<{ _id: ObjectId }>("user");
  const existing = await users.findOne({ email: DEMO.email });

  if (existing) {
    const userId = existing._id.toString();

    await clearOrders(userId);
    await db.collection("session").deleteMany({ userId });
    await db.collection("account").deleteMany({ userId });
    await users.deleteOne({ _id: existing._id });
  }

  await auth.api.signUpEmail({ body: DEMO });

  const created = await users.findOne({ email: DEMO.email });
  if (!created) throw new Error("could not create the demo user");

  return created._id.toString();
}

async function seed() {
  await ensureIndexes();

  const userId = await resetDemoUser();

  const now = new Date();
  const orderDocs: OrderDoc[] = [];
  const paymentDocs: PaymentDoc[] = [];

  for (const seedOrder of SEED_ORDERS) {
    const _id = new ObjectId();
    const subtotal = subtotalCents(seedOrder.lineItems);
    const paid = seedOrder.paymentsMade.reduce((sum, p) => sum + p.amountCents, 0);

    orderDocs.push({
      _id,
      userId,
      customer: seedOrder.customer,
      dueDate: addDays(now, seedOrder.dueInDays),
      lineItems: seedOrder.lineItems,
      subtotalCents: subtotal,
      totalCents: subtotal,
      paidCents: paid,
      dueCents: subtotal - paid,
      createdAt: now,
      updatedAt: now,
    });

    for (const payment of seedOrder.paymentsMade) {
      paymentDocs.push({
        _id: new ObjectId(),
        orderId: _id,
        userId,
        amountCents: payment.amountCents,
        paidAt: addDays(now, -payment.daysAgo),
        note: payment.note,
        createdAt: addDays(now, -payment.daysAgo),
      });
    }
  }

  await orders.insertMany(orderDocs);
  if (paymentDocs.length) await payments.insertMany(paymentDocs);

  console.log(`seeded ${orderDocs.length} orders and ${paymentDocs.length} payments`);
  console.log(`sign in as ${DEMO.email} / ${DEMO.password}`);
}

seed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => client.close());
