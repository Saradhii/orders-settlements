import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/app-header";
import { OrderForm } from "@/components/order-form";
import { PageBreadcrumb } from "@/components/page-breadcrumb";
import { auth } from "@/lib/auth";

export default async function NewOrderPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) redirect("/login");

  return (
    <>
      <AppHeader email={session.user.email} />
      <main className="mx-auto w-full max-w-4xl space-y-6 px-6 py-8">
        <div>
          <PageBreadcrumb page="New order" />
          <h1 className="mt-2 text-xl font-semibold">New order</h1>
        </div>

        <OrderForm />
      </main>
    </>
  );
}
