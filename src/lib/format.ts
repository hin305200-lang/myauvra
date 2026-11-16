export function formatMoney(cents: number, currency = "USD") {
  const hasCents = Math.abs(cents) % 100 !== 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function formatDate(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function membershipLevel(spendCents: number) {
  if (spendCents >= 800000) {
    return { name: "Maison", note: "Private viewings and the first look at new work." };
  }
  if (spendCents >= 200000) {
    return { name: "Privé", note: "Early access when a small edition is released." };
  }
  return { name: "Member", note: "Member pricing on every piece in the atelier." };
}

export function appUrl() {
  const raw = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3847";
  try {
    return new URL(raw).origin;
  } catch {
    return "http://localhost:3847";
  }
}

export function safeCallback(value: string | null | undefined, fallback: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  return value;
}

export function codeMessage(
  status: string,
  currency: string,
  minPurchase = 0,
) {
  switch (status) {
    case "applied":
      return "Code applied.";
    case "replaced_member":
      return "This code replaces member pricing because it saves more.";
    case "not_stacked":
      return "Member pricing is already applied. This code is not combined with it.";
    case "min_purchase":
      return `This code needs ${formatMoney(minPurchase, currency)} in merchandise before it applies.`;
    case "not_eligible":
      return "This code does not apply to the pieces in your bag.";
    case "inactive":
      return "This code is not active.";
    case "expired":
      return "This code has expired.";
    case "limit":
      return "This code has reached its usage limit.";
    case "customer_limit":
      return "You have already used this code.";
    case "missing":
      return "We could not find that code.";
    default:
      return null;
  }
}
