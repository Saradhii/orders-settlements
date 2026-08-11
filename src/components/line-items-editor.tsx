"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCents, toCents } from "@/lib/format";

export type Row = { description: string; quantity: string; unitPrice: string };

export const EMPTY_ROW: Row = { description: "", quantity: "1", unitPrice: "" };

export function lineTotal(row: Row) {
  const unit = toCents(row.unitPrice) ?? 0;
  const quantity = Number(row.quantity);

  return Number.isFinite(quantity) ? Math.max(0, quantity) * unit : 0;
}

export function LineItemsEditor({
  rows,
  onChange,
}: {
  rows: Row[];
  onChange: (rows: Row[]) => void;
}) {
  function update(index: number, patch: Partial<Row>) {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">Line items</h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...rows, { ...EMPTY_ROW }])}
        >
          Add line
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead className="w-24">Qty</TableHead>
              <TableHead className="w-32">Unit price</TableHead>
              <TableHead className="w-28 text-right">Amount</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Input
                    aria-label={`Line ${index + 1} description`}
                    value={row.description}
                    onChange={(e) => update(index, { description: e.target.value })}
                    required
                  />
                </TableCell>
                <TableCell>
                  <Input
                    aria-label={`Line ${index + 1} quantity`}
                    type="number"
                    min="1"
                    step="1"
                    value={row.quantity}
                    onChange={(e) => update(index, { quantity: e.target.value })}
                    required
                  />
                </TableCell>
                <TableCell>
                  <Input
                    aria-label={`Line ${index + 1} unit price`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.unitPrice}
                    onChange={(e) => update(index, { unitPrice: e.target.value })}
                    required
                  />
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCents(lineTotal(row))}
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={rows.length === 1}
                    onClick={() => onChange(rows.filter((_, i) => i !== index))}
                  >
                    Remove
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
