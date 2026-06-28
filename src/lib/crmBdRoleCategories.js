export const BD_ROLE_CATEGORIES = [
  "referral_partner",
  "graphic_designer",
  "photographer",
  "restaurant_consultant",
  "franchise_consultant",
  "corporate_chain_contact",
  "industry_sales_rep",
  "food_beverage_rep",
  "pos_vendor",
  "vendor",
  "local_influencer",
  "media_contact",
  "chamber_or_business_group",
  "investor",
  "strategic_partner",
  "other",
];

export const BD_RELATIONSHIP_STATUSES = [
  "new",
  "contacted",
  "engaged",
  "active_partner",
  "dormant",
  "declined",
];

export function formatBdRoleCategory(value) {
  return String(value || "").replace(/_/g, " ");
}
