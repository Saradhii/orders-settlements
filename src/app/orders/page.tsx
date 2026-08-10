import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { auth } from "@/lib/auth";

export default async function OrdersPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) redirect("/login");

  return (
    <main className="mx-auto w-full max-w-4xl p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-medium">Orders</h1>
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground text-sm">
            {session.user.email}
          </span>
          <ThemeToggle />
          <SignOutButton />
        </div>
      </div>
    </main>
  );
}
