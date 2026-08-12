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
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { DatePicker } from "@/components/date-picker";
import { MoneyInput } from "@/components/money-input";
import { formatCents, toCents, toDateInput } from "@/lib/format";

export function RecordPaymentDialog({
  orderId,
  dueCents,
}: {
  orderId: string;
  dueCents: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [paidAt, setPaidAt] = useState<Date | undefined>(() => new Date());
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const amountCents = toCents(amount);

    if (amountCents === null || amountCents < 1) {
      setError("Enter an amount greater than zero.");
      return;
    }

    setPending(true);
    setError("");

    const response = await fetch(`/api/orders/${orderId}/payments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        amountCents,
        paidAt: paidAt ? toDateInput(paidAt) : undefined,
        note: String(form.get("note")) || undefined,
      }),
    });

    const body = await response.json();
    setPending(false);

    if (!response.ok) {
      const max = body.error?.details?.maxAllowedCents;
      setError(
        max === undefined
          ? (body.error?.message ?? "Could not record that payment.")
          : `${body.error.message} The most you can record is ${formatCents(max)}.`,
      );
      return;
    }

    setOpen(false);
    setAmount("");
    toast.success(`Recorded ${formatCents(amountCents)}`);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button disabled={dueCents === 0}>Record payment</Button>}
      />
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Record payment</DialogTitle>
            <DialogDescription>
              {formatCents(dueCents)} is still due on this order.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <Field>
              <FieldLabel htmlFor="amount">Amount</FieldLabel>
              <MoneyInput
                id="amount"
                value={amount}
                onChange={setAmount}
                placeholder={formatCents(dueCents)}
                required
                autoFocus
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="paidAt">Date paid</FieldLabel>
              <DatePicker id="paidAt" value={paidAt} onChange={setPaidAt} />
            </Field>
            <Field>
              <FieldLabel htmlFor="note">Note</FieldLabel>
              <Input id="note" name="note" placeholder="Optional" />
            </Field>
            {error ? (
              <FieldDescription className="text-destructive">
                {error}
              </FieldDescription>
            ) : null}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? <Spinner /> : null}
              {pending ? "Recording…" : "Record payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
