import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { AppHeader } from "@/components/app-header";
import { OrderForm } from "@/components/order-form";
import { PageBreadcrumb } from "@/components/page-breadcrumb";
import { auth } from "@/lib/auth";
import { getOrder } from "@/server/orders/repository";
import { toOrderResponse } from "@/server/orders/serialize";

export default async function EditOrderPage({
  params,
}: PageProps<"/orders/[id]/edit">) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) redirect("/login");

  const found = await getOrder(session.user.id, (await params).id).catch(
    () => null,
  );

  if (!found) notFound();

  const order = toOrderResponse(found);

  return (
    <>
      <AppHeader email={session.user.email} />
      <main className="mx-auto w-full max-w-4xl space-y-6 px-6 py-8">
        <div>
          <PageBreadcrumb page={`Edit ${order.customer}`} />
          <h1 className="mt-2 text-xl font-semibold">Edit order</h1>
        </div>

        <OrderForm order={order} />
      </main>
    </>
  );
}
