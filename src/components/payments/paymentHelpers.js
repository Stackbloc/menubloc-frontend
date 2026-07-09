export function getStripePublishableKey() {
  return (import.meta.env?.VITE_STRIPE_PUBLISHABLE_KEY || "").trim();
}

export function hasStripePublishableKey() {
  return getStripePublishableKey().length > 0;
}

export function formatMoney(cents, currency = "usd") {
  if (cents == null) return "";
  const n = Number(cents);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: String(currency || "usd").toUpperCase(),
  }).format((Number.isFinite(n) ? n : 0) / 100);
}

export function getQrProductCode(packageType) {
  if (packageType === "full") return "qr_full";
  if (packageType === "table") return "qr_table";
  if (packageType === "counter") return "qr_counter";
  return "qr_basic";
}

export function getSubscriptionPlanLabel(planCode) {
  if (planCode === "menu_manager_monthly") return "Menu Manager";
  if (planCode === "founders_annual") return "Founder's";
  if (planCode === "pro_annual") return "Pro Annual";
  if (planCode === "pro_monthly") return "Pro Monthly";
  return "No active subscription";
}

export function getSubscriptionStatusLabel(status) {
  const normalized = String(status || "").trim().toLowerCase();
  if (!normalized) return "not_started";
  return normalized.replace(/_/g, " ");
}
