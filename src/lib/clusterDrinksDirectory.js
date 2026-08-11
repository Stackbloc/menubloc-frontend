export const CLUSTER_BEVERAGE_FILTERS = Object.freeze([
  { id: "all", label: "All drinks" },
  { id: "coffee", label: "Coffee & tea" },
  { id: "cocktails", label: "Cocktails" },
  { id: "wine", label: "Wine" },
  { id: "beer", label: "Beer" },
  { id: "juice", label: "Juice & smoothies" },
]);

export function beverageTypeLabel(beverageType) {
  const labels = {
    coffee: "Coffee & tea",
    cocktails: "Cocktails",
    wine: "Wine",
    beer: "Beer",
    juice: "Juice & smoothies",
    tea: "Tea",
  };
  return labels[String(beverageType || "").trim().toLowerCase()] || "Drinks";
}

export function filterDrinkSections(sections, beverageFilter = "all") {
  const normalizedFilter = String(beverageFilter || "all").trim().toLowerCase();
  if (!Array.isArray(sections) || sections.length === 0) return [];
  if (normalizedFilter === "all") return sections;

  return sections
    .map((section) => {
      const listings = (Array.isArray(section?.listings) ? section.listings : []).filter(
        (listing) => String(listing?.beverage_type || "").trim().toLowerCase() === normalizedFilter
      );
      return listings.length > 0 ? { ...section, listings } : null;
    })
    .filter(Boolean);
}

export function countDrinkListings(sections) {
  return (Array.isArray(sections) ? sections : []).reduce(
    (sum, section) => sum + (Array.isArray(section?.listings) ? section.listings.length : 0),
    0
  );
}

export const CLUSTER_BEVERAGE_FILTER_OPTIONS = Object.freeze([
  { id: "all", label: "All" },
  { id: "coffee", label: "Coffee" },
  { id: "cocktails", label: "Cocktails" },
  { id: "wine", label: "Wine" },
  { id: "beer", label: "Beer" },
]);

/** Only chips with ≥1 matching listing (plus All). Empty types are hidden. */
export function collectAvailableBeverageFilterOptions(sections) {
  const present = new Set();
  for (const section of Array.isArray(sections) ? sections : []) {
    for (const listing of Array.isArray(section?.listings) ? section.listings : []) {
      const type = String(listing?.beverage_type || "").trim().toLowerCase();
      if (type) present.add(type);
    }
  }
  const typed = CLUSTER_BEVERAGE_FILTER_OPTIONS.filter(
    (option) => option.id !== "all" && present.has(option.id)
  );
  if (typed.length === 0) return [];
  return [CLUSTER_BEVERAGE_FILTER_OPTIONS[0], ...typed];
}
