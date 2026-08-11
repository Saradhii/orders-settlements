import type { LineItem } from "@/server/orders/types";

export const DEMO = {
  name: "Demo Reviewer",
  email: "demo@example.com",
  password: "demo12345",
};

export type SeedOrder = {
  customer: string;
  dueInDays: number;
  lineItems: LineItem[];
  paymentsMade: { amountCents: number; daysAgo: number; note?: string }[];
};

export const SEED_ORDERS: SeedOrder[] = [
  {
    customer: "Ridgeline Interiors",
    dueInDays: 7,
    lineItems: [
      { description: "Oak dining chair", quantity: 2, unitPriceCents: 50000 },
    ],
    paymentsMade: [],
  },
  {
    customer: "Halcyon Studio",
    dueInDays: 14,
    lineItems: [
      {
        description: "Brand identity system",
        quantity: 1,
        unitPriceCents: 180000,
      },
      { description: "Print collateral", quantity: 4, unitPriceCents: 15000 },
    ],
    paymentsMade: [{ amountCents: 90000, daysAgo: 2, note: "Deposit" }],
  },
  {
    customer: "Northwind Trading",
    dueInDays: 3,
    lineItems: [
      { description: "Freight handling", quantity: 3, unitPriceCents: 25000 },
    ],
    paymentsMade: [
      { amountCents: 25000, daysAgo: 9, note: "Bank transfer" },
      { amountCents: 50000, daysAgo: 1 },
    ],
  },
  {
    customer: "Basalt Group",
    dueInDays: -10,
    lineItems: [
      { description: "Site survey", quantity: 1, unitPriceCents: 120000 },
      { description: "Soil sampling", quantity: 2, unitPriceCents: 30000 },
    ],
    paymentsMade: [{ amountCents: 30000, daysAgo: 21, note: "Partial" }],
  },
];
