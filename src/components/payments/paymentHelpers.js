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

export function getQrProductCode(packageTypeOrSku) {
  const raw = String(packageTypeOrSku || "").trim();
  const upper = raw.toUpperCase();
  if (upper === "QR-TABLE") return "QR-TABLE";
  const key = raw.toLowerCase();
  if (key === "table" || key === "qr_table") return "QR-TABLE";
  return "QR-TABLE";
}

export function getSubscriptionPlanLabel(planCode) {
  // menu_manager_monthly / pro_* retained for legacy historical rows only.
  if (planCode === "menu_manager_monthly") return "Menu Manager";
  if (planCode === "published_free" || planCode === "verified" || planCode === "standard") return "Standard";
  if (planCode === "starter_monthly") return "Pro Monthly";
  if (planCode === "starter_annual") return "Pro Annual";
  if (planCode === "founders_monthly") return "Founder's Monthly";
  if (planCode === "founders_annual") return "Founder's Annual";
  if (planCode === "food_truck_annual" || planCode === "foodtruck_verified_annual") {
    return "Food Truck Annual";
  }
  if (planCode === "pro_annual") return "Pro Annual";
  if (planCode === "pro_monthly") return "Pro Monthly";
  return "No active subscription";
}

export function getSubscriptionStatusLabel(status) {
  const normalized = String(status || "").trim().toLowerCase();
  if (!normalized) return "not_started";
  return normalized.replace(/_/g, " ");
}
