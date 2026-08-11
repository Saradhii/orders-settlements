import { NextResponse, type NextRequest } from "next/server";

import { parseBody, requireUserId, route } from "@/server/api/request";
import { createOrder, listOrders } from "@/server/orders/repository";
import { createOrderSchema, listOrdersQuerySchema } from "@/server/orders/schema";
import { toOrderResponse } from "@/server/orders/serialize";

export const GET = route(async (request: NextRequest) => {
  const userId = await requireUserId();
  const { status } = listOrdersQuerySchema.parse({
    status: request.nextUrl.searchParams.get("status") ?? undefined,
  });

  const found = await listOrders(userId, status);

  return NextResponse.json({ orders: found.map((o) => toOrderResponse(o)) });
});

export const POST = route(async (request: NextRequest) => {
  const userId = await requireUserId();
  const input = await parseBody(request, createOrderSchema);
  const order = await createOrder(userId, input);

  return NextResponse.json({ order: toOrderResponse(order) }, { status: 201 });
});
