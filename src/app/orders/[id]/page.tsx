import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { AppHeader } from "@/components/app-header";
import { OrderLineItems } from "@/components/order-line-items";
import { PageBreadcrumb } from "@/components/page-breadcrumb";
import { PaymentHistory } from "@/components/payment-history";
import { RecordPaymentDialog } from "@/components/record-payment-dialog";
import { StatusBadge } from "@/components/status-badge";
import { auth } from "@/lib/auth";
import { formatCents, formatDate } from "@/lib/format";
import { listPayments } from "@/server/orders/payments";
import { getOrder } from "@/server/orders/repository";
import { toOrderResponse, toPaymentResponse } from "@/server/orders/serialize";

export default async function OrderDetailPage({
  params,
}: PageProps<"/orders/[id]">) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) redirect("/login");

  const found = await getOrder(session.user.id, (await params).id).catch(
    () => null,
  );

  if (!found) notFound();

  const order = toOrderResponse(found);
  const history = await listPayments(found._id);

  const summary = [
    ["Total", formatCents(order.totalCents)],
    ["Paid", formatCents(order.paidCents)],
    ["Due", formatCents(order.dueCents)],
    ["Due date", formatDate(order.dueDate)],
  ];

  return (
    <>
      <AppHeader email={session.user.email} />
      <main className="mx-auto w-full max-w-4xl space-y-8 px-6 py-8">
        <div>
          <PageBreadcrumb page={order.customer} />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold">{order.customer}</h1>
              <StatusBadge status={order.status} />
            </div>
            <RecordPaymentDialog orderId={order.id} dueCents={order.dueCents} />
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {summary.map(([label, value]) => (
            <div key={label} className="rounded-lg border p-4">
              <dt className="text-muted-foreground text-xs">{label}</dt>
              <dd className="mt-1 font-medium tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>

        <section className="space-y-3">
          <h2 className="font-medium">Line items</h2>
          <OrderLineItems
            lineItems={order.lineItems}
            subtotalCents={order.subtotalCents}
          />
        </section>

        <section className="space-y-3">
          <h2 className="font-medium">Payment history</h2>
          <PaymentHistory payments={history.map(toPaymentResponse)} />
        </section>
      </main>
    </>
  );
}
