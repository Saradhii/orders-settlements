# Orders and Settlements

Create orders with line items, record full or partial payments against them, and see where each order stands.

Live: https://orders-settlements-weld.vercel.app

Demo account is `demo@example.com` / `demo12345`. Sign in at https://orders-settlements-weld.vercel.app/login

Next.js (App Router) and TypeScript, MongoDB via the native driver, Better Auth for email/password, Zod for validation, Tailwind and shadcn/ui, Vitest for tests.

## Setup

You need Node 20+ and a MongoDB replica set. Payments are written inside a transaction, so a standalone `mongod` won't work. Atlas free tier is fine.

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

Validation failures are 422 with a `fields` array. Over-payment, editing an order below what's already paid, and deleting an order that has payments are all 409s, with the numbers you need to fix the request.

## Status

Status is derived on every read from the amount due and the due date. It is never stored.

- `paid` when nothing is due
- `overdue` when something is due and the due date has passed
- `pending` when nothing has been paid
- `partially_paid` otherwise

A few edge cases. An order that went overdue and was then paid in full shows as `paid`, since overdue is really just a view of late unpaid work rather than a state an order gets stuck in. Overdue isn't persisted because it depends on the current time, so storing it would need a cron job and would go stale between runs. An order due exactly now isn't overdue yet.

Orders stay editable after the first payment. Names and line items genuinely need correcting after money has arrived, so freezing them felt wrong. What you can't do is drop the total below what has already been paid, or delete an order that has payments against it.

## Concurrency

Recording a payment is one conditional update. The order only changes if it still has enough due to cover the amount:

    { _id, userId, dueCents: { $gte: amountCents } }

with `$inc` on the paid and due totals. There is no read-then-write window to lose. If the condition doesn't match, the payment lost the race, and the error reports what is actually still due. The update and the payment insert share a transaction, so a rejected payment leaves nothing behind.

`POST /api/orders/:id/payments` also takes an `Idempotency-Key` header. A unique index on `{ orderId, idempotencyKey }` means a replay returns the original payment with a 200 instead of recording a second one. The payment dialog sends a key per attempt and keeps it across retries, so a double-click can't double-charge.

All of this is tested against a real database: ten simultaneous payments competing for the last slot where exactly one wins, twelve overlapping payments that must never exceed the total, and eight concurrent retries of one key collapsing into a single payment.

## Indexes

    orders    { userId: 1, dueDate: 1 }               list, sorted by due date
    orders    { userId: 1, dueCents: 1, dueDate: 1 }  status filters
    payments  { orderId: 1, createdAt: 1 }            payment history
    payments  { orderId: 1, idempotencyKey: 1 }       unique, partial, for idempotency

Every index leads with the tenancy key. Paid and due totals are denormalised onto the order so the status filters stay indexable and the list view doesn't fan out one query per order. Payments are still the record of truth, and the tests assert the two always agree.

## Assumptions

Order total is just the subtotal, so there is no tax, no discounts, and no currency other than USD. Line items live on the order document and are capped at 100. Payments can be backdated.

## Before production

Refunds and CSV export aren't built. Both were optional and I put the time into the payment path instead.

If I kept going, an append-only audit log of status changes is the first thing I'd add, since anything touching money should be able to answer who changed what and when. After that: pagination and search on the order list, rate limiting on the payment endpoint, structured request logs, and a job that re-derives paid totals from the payments collection and alerts if anything has drifted.
