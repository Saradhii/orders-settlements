"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { STATUS_LABELS } from "@/lib/status";
import { ORDER_STATUSES, type OrderStatus } from "@/server/orders/types";

const ALL = "all";

export function StatusFilter({ value }: { value?: OrderStatus }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      {pending ? <Spinner className="text-muted-foreground" /> : null}
      <Select
        value={value ?? ALL}
        onValueChange={(next) =>
          startTransition(() =>
            router.push(next === ALL ? "/orders" : `/orders?status=${next}`),
          )
        }
      >
        <SelectTrigger className="w-44" aria-label="Filter by status">
          <SelectValue>
            {(selected: string) =>
              selected === ALL
                ? "All statuses"
                : STATUS_LABELS[selected as OrderStatus]
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All statuses</SelectItem>
          {ORDER_STATUSES.map((status) => (
            <SelectItem key={status} value={status}>
              {STATUS_LABELS[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
