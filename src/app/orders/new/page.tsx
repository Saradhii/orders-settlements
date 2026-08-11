import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/app-header";
import { OrderForm } from "@/components/order-form";
import { auth } from "@/lib/auth";

export default async function NewOrderPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) redirect("/login");

  return (
    <>
      <AppHeader email={session.user.email} />
      <main className="mx-auto w-full max-w-4xl space-y-6 px-6 py-8">
        <div>
          <Link
            href="/orders"
            className="text-muted-foreground text-sm hover:underline"
          >
            ← All orders
          </Link>
          <h1 className="mt-2 text-xl font-semibold">New order</h1>
        </div>

        <OrderForm />
      </main>
    </>
  );
}
