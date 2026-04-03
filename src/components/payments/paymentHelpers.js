export function getStripePublishableKey() {
  return (import.meta.env?.VITE_STRIPE_PUBLISHABLE_KEY || "").trim();
}

export function hasStripePublishableKey() {
  return getStripePublishableKey().length > 0;
}

export function formatMoney(cents, currency = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: String(currency || "usd").toUpperCase(),
  }).format((Number(cents || 0) || 0) / 100);
}

export function getQrProductCode(packageType) {
  return packageType === "full" ? "qr_full" : "qr_basic";
}

export function getSubscriptionPlanLabel(planCode) {
  if (planCode === "pro_annual") return "Pro Annual";
  if (planCode === "pro_monthly") return "Pro Monthly";
  return "No active subscription";
}

export function getSubscriptionStatusLabel(status) {
  const normalized = String(status || "").trim().toLowerCase();
  if (!normalized) return "not_started";
  return normalized.replace(/_/g, " ");
}
