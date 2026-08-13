# Orders and Settlements

A small app for creating orders with line items, recording full or partial payments against them, and seeing where each order stands.

Live: https://orders-settlements-weld.vercel.app

You can sign up, or use the seeded demo account:

    demo@example.com
    demo12345

Built with Next.js (App Router) and TypeScript, MongoDB Atlas through the native driver, Better Auth for email/password sessions, Zod for validation, Tailwind and shadcn/ui for the interface, and Vitest for tests.

## Running it locally

You need Node 20 or newer and a MongoDB connection string. It has to be a replica set, because payments are written inside a transaction — an Atlas free tier cluster works, a plain standalone `mongod` does not.

Copy the example env file and fill it in:

    cp .env.example .env.local

`MONGODB_URI` and `MONGODB_DB` point at your cluster. `BETTER_AUTH_SECRET` can be generated with `npx @better-auth/cli secret`, and `BETTER_AUTH_URL` is `http://localhost:3000` in development.

Then:

    npm install
    npm run db:seed
    npm run dev

The seed script creates the demo user with four orders in different states, and creates the indexes. It deletes and recreates that demo user each time you run it, so don't point it at anything you care about.

Tests are `npm test`. The payment tests talk to the database from `.env.local` and skip themselves if it isn't configured.

## API

Everything under `/api/orders` requires a session cookie and only ever touches the signed-in user's own rows. Sign up and log in are handled by Better Auth under `/api/auth`.

    GET    /api/orders                  list orders, optional ?status=
    POST   /api/orders                  create an order
    GET    /api/orders/:id              one order with its payment history
    PATCH  /api/orders/:id              update customer, due date or line items
    DELETE /api/orders/:id              delete an order
    GET    /api/orders/:id/payments     payment history
    POST   /api/orders/:id/payments     record a payment

Money is always an integer number of cents, in the API and in the database. There is no floating point anywhere in the money path, so there is nothing to round.

Errors come back in one shape, with enough detail to act on:

    {
      "error": {
        "code": "OVERPAYMENT",
        "message": "That payment is more than the amount still due on this order.",
        "details": { "maxAllowedCents": 60000, "attemptedCents": 70000 }
      }
    }

Validation failures return 422 with a `fields` array naming each bad field. Over-payment, editing an order below what has already been paid, and deleting an order that has payments all return 409 with the numbers you need to correct the request.

## Status

Status is not stored. It is derived every time an order is read, from the amount still due and the due date:

- `paid` when nothing is due
- `overdue` when something is still due and the due date has passed
- `pending` when nothing has been paid yet
- `partially_paid` otherwise

A few decisions worth calling out.

An order that went past its due date and was then paid in full shows as `paid`. Being overdue isn't a state an order gets stuck in, it's just a view of unpaid work that is late, so paid wins.

Overdue is never written to the database. It depends on the current time, so storing it would mean a scheduled job to keep it honest, and it would be stale between runs. Computing it on read costs nothing and can't drift.

An order due exactly now is not yet overdue. The due date has to be in the past.

Filtering by status in the list view runs as a real query rather than filtering in memory, so the four filters translate into the same conditions the derivation uses. There is a test that generates orders across the boundaries and checks that the query and the derived status always agree.

## Orders stay editable after the first payment

I kept orders editable once payments exist, rather than freezing them. In practice a customer name gets misspelled or a line item is wrong, and the order still needs correcting after money has arrived.

The one thing you can't do is drop the total below what has already been paid, which would leave the order over-paid through the back door. That is rejected with a 409 telling you the minimum the total can be. Deleting an order is blocked once it has any payments against it.

## Concurrency

Two payments arriving at the same time is the interesting case, so it's handled by construction rather than by checking first and hoping.

Recording a payment is a single conditional update. The order is only modified if it still has enough due to cover the amount:

    { _id, userId, dueCents: { $gte: amountCents } }

with `$inc` on the paid and due amounts. There is no read-then-check-then-write window for a second request to slip through. If the condition doesn't match, the payment lost the race, and the error reports the amount that is actually still due. The update and the payment insert run inside a transaction, so a rejected payment leaves nothing behind.

`POST /api/orders/:id/payments` also accepts an `Idempotency-Key` header. A unique index on `{ orderId, idempotencyKey }` means a replayed request returns the original payment with a 200 instead of recording a second one. If two retries race, one hits the duplicate key, its transaction rolls back, and it returns the payment the winner wrote. Reusing a key with a different amount is rejected, since that is a bug on the caller's side rather than a retry. The payment dialog in the UI generates a key per attempt and holds it across retries, so a double-click or a dropped response can't double-charge.

There are tests for all of this against a real database: ten simultaneous payments competing for the last slot where exactly one wins, twelve overlapping payments that must never exceed the total, and eight concurrent retries of one key collapsing into a single payment.

## Indexes

    orders    { userId: 1, dueDate: 1 }               list, sorted by due date
    orders    { userId: 1, dueCents: 1, dueDate: 1 }  status filters
    payments  { orderId: 1, createdAt: 1 }            payment history
    payments  { orderId: 1, idempotencyKey: 1 }       unique, partial — idempotency

Every index leads with the tenancy key so no query can accidentally cross users.

The paid and due totals are denormalised onto the order rather than summed from payments on every read. That is what makes the status filters indexable and keeps the list view from fanning out one query per order. The payments collection stays the record of truth, and the concurrency tests assert that the sum of an order's payments always equals its stored paid amount.

The idempotency index is partial, covering only documents where the key is a string, so payments recorded without one don't collide.

## Assumptions

The order total is just the subtotal. No tax, discounts or multiple currencies, so everything is in USD and formatted as such.

Line items are stored on the order document. They are small, bounded (capped at 100), and only ever read with their order, so a separate collection would buy nothing.

Payments can be backdated, since recording something that arrived last week is normal. Payment dates aren't validated against the order's creation date.

## What I would do before production

Refunds and a CSV export are the two obvious functional gaps — both were stretch goals and I left them out to keep the payment path solid instead.

An append-only audit log of status changes is the first thing I would add. The data model already supports it, and anything touching money should be able to answer who changed what and when.

Beyond that: pagination and server-side search on the list once an account has more than a screenful of orders, per-tenant rate limiting on the payment endpoint, structured request logs shipped somewhere queryable, and a reconciliation job that re-derives paid totals from the payments collection and alerts on any drift. If real payments were being ingested from a provider rather than entered by hand, the webhook path would need replay protection and an outbox for downstream events.
