import Link from "next/link";

import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";

export function AppHeader({ email }: { email: string }) {
  return (
    <header className="border-b">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/orders" className="font-medium">
          Orders &amp; Settlements
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground hidden text-sm sm:inline">
            {email}
          </span>
          <ThemeToggle />
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
