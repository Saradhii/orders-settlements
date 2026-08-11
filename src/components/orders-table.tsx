import Link from "next/link";

import { StatusBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCents, formatDate } from "@/lib/format";
import type { OrderResponse } from "@/server/orders/serialize";

export function OrdersTable({ orders }: { orders: OrderResponse[] }) {
  if (orders.length === 0) {
    return (
      <p className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
        No orders to show.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Due date</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-right">Paid</TableHead>
            <TableHead className="text-right">Due</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell>
                <Link
                  href={`/orders/${order.id}`}
                  className="font-medium hover:underline"
                >
                  {order.customer}
                </Link>
              </TableCell>
              <TableCell>
                <StatusBadge status={order.status} />
              </TableCell>
              <TableCell>{formatDate(order.dueDate)}</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatCents(order.totalCents)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatCents(order.paidCents)}
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {formatCents(order.dueCents)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
