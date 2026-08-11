import { describe, expect, it } from "vitest";

import { deriveStatus, statusFilter, subtotalCents } from "./domain";
import { ORDER_STATUSES, type StatusInput } from "./types";

const NOW = new Date("2026-08-11T00:00:00Z");
const NEXT_WEEK = new Date("2026-08-18T00:00:00Z");
const LAST_WEEK = new Date("2026-08-04T00:00:00Z");

describe("subtotalCents", () => {
  it("is zero for an order with no line items", () => {
    expect(subtotalCents([])).toBe(0);
  });

  it("multiplies quantity by unit price", () => {
    expect(
      subtotalCents([
        { description: "Chair", quantity: 2, unitPriceCents: 50000 },
      ]),
    ).toBe(100000);
  });

  it("sums across multiple line items", () => {
    expect(
      subtotalCents([
        { description: "Chair", quantity: 2, unitPriceCents: 50000 },
        { description: "Desk", quantity: 1, unitPriceCents: 25050 },
      ]),
    ).toBe(125050);
  });

  it("stays exact for amounts that would drift as floats", () => {
    expect(
      subtotalCents([
        { description: "Widget", quantity: 3, unitPriceCents: 10 },
      ]),
    ).toBe(30);
  });
});

describe("deriveStatus", () => {
  it("is pending when nothing has been paid", () => {
    const order = { paidCents: 0, dueCents: 100000, dueDate: NEXT_WEEK };
    expect(deriveStatus(order, NOW)).toBe("pending");
  });

  it("is partially_paid once some but not all is paid", () => {
    const order = { paidCents: 40000, dueCents: 60000, dueDate: NEXT_WEEK };
    expect(deriveStatus(order, NOW)).toBe("partially_paid");
  });

  it("is paid when nothing remains due", () => {
    const order = { paidCents: 100000, dueCents: 0, dueDate: NEXT_WEEK };
    expect(deriveStatus(order, NOW)).toBe("paid");
  });

  it("is overdue when unpaid and past the due date", () => {
    const order = { paidCents: 0, dueCents: 100000, dueDate: LAST_WEEK };
    expect(deriveStatus(order, NOW)).toBe("overdue");
  });

  it("reports overdue rather than partially_paid past the due date", () => {
    const order = { paidCents: 40000, dueCents: 60000, dueDate: LAST_WEEK };
    expect(deriveStatus(order, NOW)).toBe("overdue");
  });

  it("reports paid rather than overdue once fully settled late", () => {
    const order = { paidCents: 100000, dueCents: 0, dueDate: LAST_WEEK };
    expect(deriveStatus(order, NOW)).toBe("paid");
  });

  it("treats an order due exactly now as not yet overdue", () => {
    const order = { paidCents: 0, dueCents: 100000, dueDate: NOW };
    expect(deriveStatus(order, NOW)).toBe("pending");
  });

  it("walks the sample scenario from pending to paid", () => {
    const total = 100000;
    const after = (paid: number) => ({
      paidCents: paid,
      dueCents: total - paid,
      dueDate: NEXT_WEEK,
    });

    expect(deriveStatus(after(0), NOW)).toBe("pending");
    expect(deriveStatus(after(40000), NOW)).toBe("partially_paid");
    expect(deriveStatus(after(100000), NOW)).toBe("paid");
  });
});

function matches(filter: Record<string, unknown>, order: StatusInput) {
  return Object.entries(filter).every(([field, condition]) => {
    const value = order[field as keyof StatusInput];

    if (typeof condition !== "object" || condition === null) {
      return value === condition;
    }

    return Object.entries(condition).every(([operator, bound]) => {
      if (operator === "$gt") return value > bound;
      if (operator === "$lt") return value < bound;
      if (operator === "$gte") return value >= bound;

      throw new Error(`unhandled operator ${operator}`);
    });
  });
}

describe("statusFilter", () => {
  const orders: StatusInput[] = [
    { paidCents: 0, dueCents: 100000, dueDate: NEXT_WEEK },
    { paidCents: 40000, dueCents: 60000, dueDate: NEXT_WEEK },
    { paidCents: 100000, dueCents: 0, dueDate: NEXT_WEEK },
    { paidCents: 0, dueCents: 100000, dueDate: LAST_WEEK },
    { paidCents: 40000, dueCents: 60000, dueDate: LAST_WEEK },
    { paidCents: 100000, dueCents: 0, dueDate: LAST_WEEK },
  ];

  it("selects exactly the orders that derive to the same status", () => {
    for (const status of ORDER_STATUSES) {
      const selected = orders.filter((order) =>
        matches(statusFilter(status, NOW), order),
      );
      const derived = orders.filter(
        (order) => deriveStatus(order, NOW) === status,
      );

      expect(selected).toEqual(derived);
    }
  });

  it("assigns every order to exactly one status", () => {
    for (const order of orders) {
      const hits = ORDER_STATUSES.filter((status) =>
        matches(statusFilter(status, NOW), order),
      );

      expect(hits).toHaveLength(1);
    }
  });
});
