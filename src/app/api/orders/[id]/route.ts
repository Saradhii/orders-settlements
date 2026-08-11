import { NextResponse, type NextRequest } from "next/server";

import { parseBody, requireUserId, route } from "@/server/api/request";
import {
  deleteOrder,
  getOrder,
  listPayments,
  updateOrder,
} from "@/server/orders/repository";
import { updateOrderSchema } from "@/server/orders/schema";
import { toOrderResponse, toPaymentResponse } from "@/server/orders/serialize";

type Context = { params: Promise<{ id: string }> };

export const GET = route(async (_request: NextRequest, { params }: Context) => {
  const userId = await requireUserId();
  const order = await getOrder(userId, (await params).id);
  const history = await listPayments(order._id);

  return NextResponse.json({
    order: toOrderResponse(order),
    payments: history.map(toPaymentResponse),
  });
});

export const PATCH = route(async (request: NextRequest, { params }: Context) => {
  const userId = await requireUserId();
  const input = await parseBody(request, updateOrderSchema);
  const order = await updateOrder(userId, (await params).id, input);

  return NextResponse.json({ order: toOrderResponse(order) });
});

export const DELETE = route(
  async (_request: NextRequest, { params }: Context) => {
    const userId = await requireUserId();

    await deleteOrder(userId, (await params).id);

    return new NextResponse(null, { status: 204 });
  },
);
