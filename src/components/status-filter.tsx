"use client";

import { useRouter } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STATUS_LABELS } from "@/lib/status";
import { ORDER_STATUSES, type OrderStatus } from "@/server/orders/types";

const ALL = "all";

export function StatusFilter({ value }: { value?: OrderStatus }) {
  const router = useRouter();

  return (
    <Select
      value={value ?? ALL}
      onValueChange={(next) =>
        router.push(next === ALL ? "/orders" : `/orders?status=${next}`)
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
  );
}
