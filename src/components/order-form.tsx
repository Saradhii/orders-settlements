"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  EMPTY_ROW,
  LineItemsEditor,
  lineTotal,
  type Row,
} from "@/components/line-items-editor";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { formatCents, toCents } from "@/lib/format";

export function OrderForm() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([{ ...EMPTY_ROW }]);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const subtotal = rows.reduce((total, row) => total + lineTotal(row), 0);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    setPending(true);
    setError("");

    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        customer: String(form.get("customer")),
        dueDate: String(form.get("dueDate")),
        lineItems: rows.map((row) => ({
          description: row.description,
          quantity: Number(row.quantity),
          unitPriceCents: toCents(row.unitPrice) ?? 0,
        })),
      }),
    });

    const body = await response.json();

    if (!response.ok) {
      setPending(false);
      const fields = body.error?.details?.fields;
      setError(
        fields?.length
          ? fields.map((f: { message: string }) => f.message).join(" ")
          : (body.error?.message ?? "Could not create that order."),
      );
      return;
    }

    router.push(`/orders/${body.order.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="customer">Customer</FieldLabel>
          <Input id="customer" name="customer" required autoFocus />
        </Field>
        <Field>
          <FieldLabel htmlFor="dueDate">Due date</FieldLabel>
          <Input id="dueDate" name="dueDate" type="date" required />
        </Field>
      </div>

      <LineItemsEditor rows={rows} onChange={setRows} />

      <p className="text-right text-sm">
        Order total{" "}
        <span className="font-medium tabular-nums">{formatCents(subtotal)}</span>
      </p>

      {error ? (
        <FieldDescription className="text-destructive">{error}</FieldDescription>
      ) : null}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create order"}
        </Button>
      </div>
    </form>
  );
}
