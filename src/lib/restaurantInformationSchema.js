/**
 * Shared Restaurant Information field schema + client validation.
 * Used by onboarding and (later) operator settings — not by legacy RestaurantProfile.
 *
 * Address / geo / location-specific fields are owned by the Locations stage
 * (see locationEntryPolicy + ownedLocationsService). They must not be written
 * from Restaurant Information.
 */

/** Restaurant-level fields owned by Restaurant Information. */
export const RESTAURANT_INFORMATION_EDITABLE_FIELDS = Object.freeze([
  "restaurant_name",
  "category",
  "cuisine",
  "manager_name",
  "phone",
  "website_url",
]);

/**
 * Location-owned columns that may still exist on public.restaurants rows
 * (legacy / transitional). Information must not write these.
 */
export const LOCATION_OWNED_FIELDS = Object.freeze([
  "address_line1",
  "address_line2",
  "city",
  "state",
  "postal_code",
  "country_code",
  "lat",
  "lng",
  "timezone",
]);

/** Fields that must never be submitted from the client (identity / protected). */
export const RESTAURANT_INFORMATION_PROTECTED_FIELDS = Object.freeze([
  "id",
  "authoritative_restaurant_id",
  "chain_id",
  "franchise_id",
  "slug",
  "legacy_slug",
  "claim_status",
  "ownership_type",
  "is_franchise",
  "google_place_id",
  "lat",
  "lng",
  "timezone",
]);

export const RESTAURANT_INFORMATION_REQUIRED_FOR_CONTINUE = Object.freeze([
  "restaurant_name",
  "category",
  "phone",
]);

export function emptyRestaurantInformationForm() {
  return {
    restaurant_name: "",
    category: "",
    cuisine: "",
    manager_name: "",
    phone: "",
    website_url: "",
    email: "",
  };
}

export function formatPhoneDisplay(raw) {
  const digits = String(raw || "").replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function restaurantToInformationForm(restaurant = {}, accountEmail = "") {
  return {
    restaurant_name: String(restaurant.restaurant_name || "").trim(),
    category: String(restaurant.category || "").trim(),
    cuisine: String(restaurant.cuisine || "").trim(),
    manager_name: String(restaurant.manager_name || "").trim(),
    phone: formatPhoneDisplay(restaurant.phone || ""),
    website_url: String(restaurant.website_url || restaurant.website || "").trim(),
    email: String(accountEmail || restaurant.email || "").trim(),
  };
}

export function buildRestaurantInformationPayload(form, { complete = false } = {}) {
  const payload = {
    restaurant_name: String(form.restaurant_name || "").trim(),
    category: String(form.category || "").trim(),
    cuisine: String(form.cuisine || "").trim() || null,
    manager_name: String(form.manager_name || "").trim() || null,
    phone: String(form.phone || "").replace(/\D/g, "") || null,
    website_url: String(form.website_url || "").trim() || null,
  };
  if (complete) payload.complete = true;
  return payload;
}

export function validateRestaurantInformationForm(form, { complete = false } = {}) {
  if (!complete) {
    if (!String(form.restaurant_name || "").trim() && !String(form.category || "").trim()) {
      return {
        ok: false,
        missing: ["restaurant_name"],
        message: "Enter at least a restaurant name or category to save a draft.",
      };
    }
    return { ok: true, missing: [] };
  }

  const missing = RESTAURANT_INFORMATION_REQUIRED_FOR_CONTINUE.filter(
    (key) => !String(form[key] || "").trim()
  );
  if (missing.length) {
    return {
      ok: false,
      missing,
      message: `Please complete: ${missing.join(", ").replace(/_/g, " ")}`,
    };
  }
  return { ok: true, missing: [] };
}

/** After information: continue to Locations (address SoT). */
export function resolvePostInformationPath() {
  return "/restaurant/onboarding/locations";
}

/** After locations: menu upload (Worksheet next) — never design-select or subscription. */
export function resolvePostLocationsPath(_onboarding = {}) {
  return "/restaurant/menu-upload-choice";
}

/** Plans that explicitly bypass Payment (must be recorded server-side, not inferred only). */
export function isFreePlanPaymentBypassEligible(planCode) {
  const plan = String(planCode || "").trim().toLowerCase();
  return plan === "verified" || plan === "published_free" || plan === "published";
}
