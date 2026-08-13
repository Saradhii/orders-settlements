import { NextResponse, type NextRequest } from "next/server";

import { parseBody, requireUserId, route } from "@/server/api/request";
import { listPayments, recordPayment } from "@/server/orders/payments";
import { getOrder } from "@/server/orders/repository";
import {
  idempotencyKeySchema,
  recordPaymentSchema,
} from "@/server/orders/schema";
import { toOrderResponse, toPaymentResponse } from "@/server/orders/serialize";

type Context = { params: Promise<{ id: string }> };

export const GET = route(async (_request: NextRequest, { params }: Context) => {
  const userId = await requireUserId();
  const order = await getOrder(userId, (await params).id);
  const history = await listPayments(order._id);

  return NextResponse.json({ payments: history.map(toPaymentResponse) });
});

export const POST = route(async (request: NextRequest, { params }: Context) => {
  const userId = await requireUserId();
  const input = await parseBody(request, recordPaymentSchema);
  const idempotencyKey = idempotencyKeySchema.parse(
    request.headers.get("idempotency-key") ?? undefined,
  );

  const result = await recordPayment(
    userId,
    (await params).id,
    input,
    idempotencyKey,
  );

  return NextResponse.json(
    {
      order: toOrderResponse(result.order),
      payment: toPaymentResponse(result.payment),
    },
    { status: result.replayed ? 200 : 201 },
  );
});
