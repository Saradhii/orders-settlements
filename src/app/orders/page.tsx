import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/app-header";
import { OrdersTable } from "@/components/orders-table";
import { StatusFilter } from "@/components/status-filter";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { listOrders } from "@/server/orders/repository";
import { toOrderResponse } from "@/server/orders/serialize";
import { ORDER_STATUSES, type OrderStatus } from "@/server/orders/types";

function readStatus(value: string | string[] | undefined) {
  return ORDER_STATUSES.find((status) => status === value);
}

export default async function OrdersPage({
  searchParams,
}: PageProps<"/orders">) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) redirect("/login");

  const status = readStatus((await searchParams).status) as
    | OrderStatus
    | undefined;
  const orders = await listOrders(session.user.id, status);

  return (
    <>
      <AppHeader email={session.user.email} />
      <main className="mx-auto w-full max-w-5xl space-y-6 px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">Orders</h1>
            <p className="text-muted-foreground text-sm">
              {orders.length} {orders.length === 1 ? "order" : "orders"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusFilter value={status} />
            <Button render={<Link href="/orders/new">New order</Link>} />
          </div>
        </div>

        <OrdersTable orders={orders.map((order) => toOrderResponse(order))} />
      </main>
    </>
  );
}
