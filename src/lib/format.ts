export function formatCents(cents: number) {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

export function formatDate(value: string | Date) {
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function toDateInput(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${date.getFullYear()}-${month}-${day}`;
}

export function toCents(value: string) {
  const match = value.trim().match(/^(\d*)(?:\.(\d{1,2}))?$/);

  if (!match) return null;

  const [, whole, fraction = ""] = match;

  if (!whole && !fraction) return null;

  return Number(whole || 0) * 100 + Number(fraction.padEnd(2, "0"));
}
