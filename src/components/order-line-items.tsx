import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCents } from "@/lib/format";
import type { LineItem } from "@/server/orders/types";

export function OrderLineItems({
  lineItems,
  subtotalCents,
}: {
  lineItems: LineItem[];
  subtotalCents: number;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead className="text-right">Unit price</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lineItems.map((item, index) => (
            <TableRow key={index}>
              <TableCell>{item.description}</TableCell>
              <TableCell className="text-right tabular-nums">
                {item.quantity}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatCents(item.unitPriceCents)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatCents(item.quantity * item.unitPriceCents)}
              </TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell colSpan={3} className="font-medium">
              Subtotal
            </TableCell>
            <TableCell className="text-right font-medium tabular-nums">
              {formatCents(subtotalCents)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
