import { orders, payments } from "./collections";

export async function ensureIndexes() {
  await orders.createIndexes([
    { key: { userId: 1, dueDate: 1 } },
    { key: { userId: 1, dueCents: 1, dueDate: 1 } },
  ]);

  await payments.createIndexes([{ key: { orderId: 1, createdAt: 1 } }]);
}
