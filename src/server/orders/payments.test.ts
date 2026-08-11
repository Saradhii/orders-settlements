import { ObjectId } from "mongodb";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { ApiError } from "@/server/api/errors";

const hasDatabase = Boolean(process.env.MONGODB_URI && process.env.MONGODB_DB);

const USER_ID = "concurrency-test-user";

const NEW_ORDER = {
  customer: "Race Test",
  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  lineItems: [{ description: "Item", quantity: 2, unitPriceCents: 50000 }],
};

describe.skipIf(!hasDatabase)("recordPayment", async () => {
  const { client } = await import("@/server/db/client");
  const { orders, payments } = await import("@/server/db/collections");
  const { createOrder } = await import("./repository");
  const { recordPayment } = await import("./payments");

  async function clear() {
    const owned = await orders
      .find({ userId: USER_ID }, { projection: { _id: 1 } })
      .toArray();

    await payments.deleteMany({ orderId: { $in: owned.map((o) => o._id) } });
    await orders.deleteMany({ userId: USER_ID });
  }

  async function seedOrder(paidCents: number) {
    const order = await createOrder(USER_ID, NEW_ORDER);

    if (paidCents > 0) {
      await recordPayment(USER_ID, order._id.toString(), {
        amountCents: paidCents,
      });
    }

    return order._id;
  }

  async function reload(id: ObjectId) {
    const order = await orders.findOne({ _id: id });
    const history = await payments.find({ orderId: id }).toArray();

    return { order, history };
  }

  beforeEach(clear);

  afterAll(async () => {
    await clear();
    await client.close();
  });

  it("settles an order across two partial payments", async () => {
    const id = await seedOrder(0);

    await recordPayment(USER_ID, id.toString(), { amountCents: 40000 });
    const { order } = await reload(id);

    expect(order?.paidCents).toBe(40000);
    expect(order?.dueCents).toBe(60000);

    await recordPayment(USER_ID, id.toString(), { amountCents: 60000 });
    const settled = await reload(id);

    expect(settled.order?.paidCents).toBe(100000);
    expect(settled.order?.dueCents).toBe(0);
  });

  it("rejects a payment larger than the amount due", async () => {
    const id = await seedOrder(40000);

    const error = await recordPayment(USER_ID, id.toString(), {
      amountCents: 70000,
    }).catch((caught) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.code).toBe("OVERPAYMENT");
    expect(error.details).toEqual({
      maxAllowedCents: 60000,
      attemptedCents: 70000,
    });
  });

  it("leaves no payment behind when a payment is rejected", async () => {
    const id = await seedOrder(40000);

    await recordPayment(USER_ID, id.toString(), { amountCents: 70000 }).catch(
      () => undefined,
    );

    const { order, history } = await reload(id);

    expect(order?.paidCents).toBe(40000);
    expect(history).toHaveLength(1);
  });

  it("lets exactly one of ten simultaneous payments win the last slot", async () => {
    const id = await seedOrder(40000);

    const attempts = await Promise.allSettled(
      Array.from({ length: 10 }, () =>
        recordPayment(USER_ID, id.toString(), { amountCents: 60000 }),
      ),
    );

    const settled = attempts.filter((a) => a.status === "fulfilled");
    const refused = attempts.filter((a) => a.status === "rejected");

    expect(settled).toHaveLength(1);
    expect(refused).toHaveLength(9);

    for (const attempt of refused) {
      expect((attempt.reason as ApiError).code).toBe("OVERPAYMENT");
    }

    const { order, history } = await reload(id);

    expect(order?.paidCents).toBe(100000);
    expect(order?.dueCents).toBe(0);
    expect(history).toHaveLength(2);
    expect(history.reduce((sum, p) => sum + p.amountCents, 0)).toBe(
      order?.paidCents,
    );
  });

  it("never lets concurrent payments exceed the order total", async () => {
    const id = await seedOrder(0);

    await Promise.allSettled(
      Array.from({ length: 12 }, () =>
        recordPayment(USER_ID, id.toString(), { amountCents: 30000 }),
      ),
    );

    const { order, history } = await reload(id);

    expect(order?.paidCents).toBeLessThanOrEqual(100000);
    expect(order?.dueCents).toBeGreaterThanOrEqual(0);
    expect(history.reduce((sum, p) => sum + p.amountCents, 0)).toBe(
      order?.paidCents,
    );
  });
});
