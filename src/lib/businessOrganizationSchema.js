/**
 * Business Organization onboarding form helpers.
 * Private legal/billing fields — never expose on public restaurant pages.
 */

import { US_STATE_OPTIONS } from "./locationEntryPolicy.js";

export const ENTITY_TYPE_OPTIONS = Object.freeze([
  { value: "individual_sole_proprietor", label: "Sole proprietor" },
  { value: "llc", label: "LLC" },
  { value: "corporation", label: "Corporation" },
  { value: "partnership", label: "Partnership" },
  { value: "nonprofit", label: "Nonprofit" },
  { value: "other", label: "Other" },
]);

export const RELATIONSHIP_TYPE_OPTIONS = Object.freeze([
  { value: "owner", label: "Owner" },
  { value: "operator", label: "Operator" },
  { value: "franchisee", label: "Franchisee" },
  { value: "licensee", label: "Licensee" },
  { value: "management_company", label: "Management company" },
]);

/** US states + DC for optional State of formation (jurisdiction). */
export const JURISDICTION_STATE_OPTIONS = US_STATE_OPTIONS;

const JURISDICTION_STATE_CODES = new Set(
  JURISDICTION_STATE_OPTIONS.map((o) => o.value)
);

/** Neutral provisional backfill label — never show as typed legal name. */
export const PENDING_ORGANIZATION_LEGAL_NAME = "Pending organization review";

export function emptyBusinessOrganizationForm() {
  return {
    legal_name: "",
    dba_trade_name: "",
    entity_type: "individual_sole_proprietor",
    country_code: "US",
    jurisdiction: "",
    primary_contact_name: "",
    billing_email: "",
    billing_phone: "",
    relationship_to_restaurant: "owner",
  };
}

/**
 * Legal entity name for the onboarding form.
 * Blank when unconfirmed (provisional / pending placeholder / restaurant display name).
 * Confirmed saved orgs still hydrate for resume/edit.
 */
export function resolveLegalNameForForm(org = {}, { restaurantDisplayName } = {}) {
  const raw = String(org.legal_name || "").trim();
  if (!raw) return "";
  if (org.is_provisional === true) return "";
  if (raw.toLowerCase() === PENDING_ORGANIZATION_LEGAL_NAME.toLowerCase()) return "";
  const display = String(restaurantDisplayName || "").trim();
  if (display && raw.toLowerCase() === display.toLowerCase()) return "";
  return raw;
}

function normalizeJurisdictionCode(raw) {
  const code = String(raw || "")
    .trim()
    .toUpperCase()
    .slice(0, 2);
  if (!code) return "";
  return JURISDICTION_STATE_CODES.has(code) ? code : "";
}

export function organizationToForm(org = {}, relationship = {}, options = {}) {
  const entityType = org.entity_type || "individual_sole_proprietor";
  return {
    legal_name: resolveLegalNameForForm(org, options),
    dba_trade_name: org.dba_trade_name || "",
    entity_type: entityType,
    country_code: org.country_code || "US",
    jurisdiction: normalizeJurisdictionCode(org.jurisdiction || org.tax_jurisdiction || ""),
    primary_contact_name: org.primary_contact_name || "",
    billing_email: org.billing_email || "",
    billing_phone: org.billing_phone || "",
    relationship_to_restaurant: relationship.relationship_type || "owner",
  };
}

export function validateBusinessOrganizationForm(form = {}) {
  const errors = {};
  if (!String(form.legal_name || "").trim() || String(form.legal_name).trim().length < 2) {
    errors.legal_name = "Legal entity name is required.";
  }
  if (!ENTITY_TYPE_OPTIONS.some((o) => o.value === form.entity_type)) {
    errors.entity_type = "Select a valid entity type.";
  }
  if (!String(form.country_code || "").trim()) {
    errors.country_code = "Country / jurisdiction is required.";
  }
  const jurisdictionRaw = String(form.jurisdiction || "").trim();
  if (jurisdictionRaw) {
    const code = jurisdictionRaw.toUpperCase().slice(0, 2);
    if (!JURISDICTION_STATE_CODES.has(code)) {
      errors.jurisdiction = "Select a valid US state of formation.";
    }
  }
  const email = String(form.billing_email || "").trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.billing_email = "Enter a valid billing email.";
  }
  if (!RELATIONSHIP_TYPE_OPTIONS.some((o) => o.value === form.relationship_to_restaurant)) {
    errors.relationship_to_restaurant = "Select how this organization relates to the restaurant.";
  }
  return {
    ok: Object.keys(errors).length === 0,
    errors,
  };
}

export function buildBusinessOrganizationPayload(form = {}) {
  const jurisdiction = normalizeJurisdictionCode(form.jurisdiction || form.tax_jurisdiction || "");
  return {
    legal_name: String(form.legal_name || "").trim(),
    dba_trade_name: String(form.dba_trade_name || "").trim() || null,
    entity_type: form.entity_type || "individual_sole_proprietor",
    country_code: String(form.country_code || "US").trim().toUpperCase().slice(0, 2),
    jurisdiction: jurisdiction || null,
    primary_contact_name: String(form.primary_contact_name || "").trim() || null,
    billing_email: String(form.billing_email || "").trim() || null,
    billing_phone: String(form.billing_phone || "").trim() || null,
    relationship_to_restaurant: form.relationship_to_restaurant || "owner",
  };
}

/**
 * After organization: free plans → information (payment skip on server);
 * paid / unknown paid codes → Menuply plan Stripe checkout.
 * QR merchandise is reserved later — not charged from this path.
 */
export function resolvePostOrganizationPath(onboarding = {}) {
  const plan = String(
    onboarding.selected_plan_code ||
      onboarding.selected_plan ||
      onboarding.plan ||
      ""
  )
    .trim()
    .toLowerCase();
  if (
    !plan ||
    plan === "verified" ||
    plan === "published_free" ||
    plan === "published"
  ) {
    return "/restaurant/onboarding/information";
  }
  return "/restaurant/subscription";
}
