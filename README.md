# Orders and Settlements

Create orders with line items, record full or partial payments against them, and see where each order stands.

Live: https://orders-settlements-weld.vercel.app

Demo account: `demo@example.com` / `demo12345`

Next.js (App Router) and TypeScript, MongoDB via the native driver, Better Auth for email/password, Zod for validation, Tailwind and shadcn/ui, Vitest for tests.

## Setup

Needs Node 20+ and a MongoDB replica set — payments are written in a transaction, so a standalone `mongod` won't work. Atlas free tier is fine.

    cp .env.example .env.local   # fill in MONGODB_URI, MONGODB_DB, BETTER_AUTH_SECRET
    npm install
    npm run db:seed
    npm run dev

The seed creates the demo user with four orders in different states and builds the indexes. It wipes and recreates that user every run.

`npm test` runs the tests. The payment tests need a database and skip themselves without one.

## API

Everything under `/api/orders` needs a session and only touches the signed-in user's own data. Auth lives under `/api/auth`.

    GET    /api/orders                  list, optional ?status=
    POST   /api/orders                  create
    GET    /api/orders/:id              order with payment history
    PATCH  /api/orders/:id              update customer, due date or line items
    DELETE /api/orders/:id              delete
    GET    /api/orders/:id/payments     payment history
    POST   /api/orders/:id/payments     record a payment

Money is integer cents everywhere, so there is nothing to round. Errors share one shape:

    {
      "error": {
        "code": "OVERPAYMENT",
        "message": "That payment is more than the amount still due on this order.",
        "details": { "maxAllowedCents": 60000, "attemptedCents": 70000 }
      }
    }

Validation failures are 422 with a `fields` array. Over-payment, editing an order below what's already paid, and deleting an order that has payments are 409s with the numbers needed to fix the request.

## Status

Derived on every read from the amount due and the due date, never stored:

- `paid` when nothing is due
- `overdue` when something is due and the due date has passed
- `pending` when nothing has been paid
- `partially_paid` otherwise

Edge cases: an order that went overdue and was then paid in full shows as `paid` — overdue is a view of late unpaid work, not a state you get stuck in. Overdue isn't persisted because it depends on the current time and would go stale between cron runs. An order due exactly now isn't overdue yet.

Orders stay editable after the first payment, since names and line items genuinely need correcting after money arrives. You just can't drop the total below what's already been paid, and you can't delete an order that has payments.

## Concurrency

Recording a payment is one conditional update — the order only changes if it still has enough due to cover the amount:

    { _id, userId, dueCents: { $gte: amountCents } }

with `$inc` on the paid and due totals. There's no read-then-write window to lose. If the condition doesn't match, the payment lost the race and the error reports what's actually still due. The update and the payment insert share a transaction, so a rejected payment leaves nothing behind.

`POST /api/orders/:id/payments` also takes an `Idempotency-Key` header. A unique index on `{ orderId, idempotencyKey }` makes a replay return the original payment with a 200 instead of recording a second one. The payment dialog sends a key per attempt and keeps it across retries, so a double-click can't double-charge.

Tested against a real database: ten simultaneous payments competing for the last slot (one wins), twelve overlapping payments that must never exceed the total, and eight concurrent retries of one key collapsing into a single payment.

## Indexes

    orders    { userId: 1, dueDate: 1 }               list, sorted by due date
    orders    { userId: 1, dueCents: 1, dueDate: 1 }  status filters
    payments  { orderId: 1, createdAt: 1 }            payment history
    payments  { orderId: 1, idempotencyKey: 1 }       unique, partial — idempotency

Every index leads with the tenancy key. Paid and due totals are denormalised onto the order so status filters stay indexable and the list view doesn't fan out per order; payments remain the record of truth, and the tests assert the two always agree.

## Assumptions

Order total is just the subtotal — no tax, discounts or currencies beyond USD. Line items live on the order document, capped at 100. Payments can be backdated.

## Before production

Refunds and CSV export are the gaps — both stretch goals I skipped to keep the payment path solid. An append-only audit log would be first in. After that: pagination and search on the list, rate limiting on the payment endpoint, structured logs, and a reconciliation job that re-derives paid totals from payments and alerts on drift.
