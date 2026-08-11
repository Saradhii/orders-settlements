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

export function toCents(value: string) {
  const amount = Number(value);

  if (!value.trim() || !Number.isFinite(amount)) return null;

  return Math.round(amount * 100);
}
