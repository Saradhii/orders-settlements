"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FieldDescription } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";

export function DeleteOrderDialog({
  orderId,
  customer,
  paidCents,
}: {
  orderId: string;
  customer: string;
  paidCents: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    setPending(true);
    setError("");

    const response = await fetch(`/api/orders/${orderId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setPending(false);
      setError(body?.error?.message ?? "Could not delete that order.");
      return;
    }

    setOpen(false);
    toast.success(`Deleted ${customer}`);
    router.push("/orders");
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" disabled={paidCents > 0}>
            Delete
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this order?</DialogTitle>
          <DialogDescription>
            {customer} and its line items will be removed. This cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <FieldDescription className="text-destructive">
            {error}
          </FieldDescription>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleDelete} disabled={pending}>
            {pending ? <Spinner /> : null}
            {pending ? "Deleting…" : "Delete order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
