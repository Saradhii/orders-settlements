"use client";

import { NumericFormat } from "react-number-format";

import { Input } from "@/components/ui/input";

type NumericInputProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  autoFocus?: boolean;
  "aria-label"?: string;
};

export function MoneyInput({ value, onChange, ...props }: NumericInputProps) {
  return (
    <NumericFormat
      {...props}
      customInput={Input}
      value={value}
      onValueChange={(values) => onChange(values.value)}
      thousandSeparator=","
      decimalScale={2}
      allowNegative={false}
      allowLeadingZeros={false}
      prefix="$"
      inputMode="decimal"
      autoComplete="off"
    />
  );
}

export function QuantityInput({ value, onChange, ...props }: NumericInputProps) {
  return (
    <NumericFormat
      {...props}
      customInput={Input}
      value={value}
      onValueChange={(values) => onChange(values.value)}
      decimalScale={0}
      allowNegative={false}
      allowLeadingZeros={false}
      inputMode="numeric"
      autoComplete="off"
    />
  );
}
