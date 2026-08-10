"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();

  async function handleClick() {
    await signOut();
    router.push("/login");
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick}>
      Sign out
    </Button>
  );
}
