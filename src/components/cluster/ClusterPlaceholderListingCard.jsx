function placeholderStatusLabel(status) {
  const normalized = String(status || "").trim().toLowerCase();
  if (normalized === "menu_pending") {
    return "Drink menu in progress";
  }
  if (normalized === "pending_verification") {
    return "Listing pending verification";
  }
  return "Menu coming soon";
}

export default function ClusterPlaceholderListingCard({ listing, showBeverageType = false }) {
  const name = listing?.name || "Unnamed listing";
  const location = listing?.location ? String(listing.location).trim() : "";
  const statusLabel = placeholderStatusLabel(listing?.status);
  const isDrink = String(listing?.listing_kind || "").trim().toLowerCase() === "drinks";
  const beverageLabel =
    showBeverageType && listing?.beverage_type
      ? String(listing.beverage_type).trim()
      : "";

  return (
    <div
      style={{
        display: "grid",
        gap: "0.35rem",
        padding: "0.9rem 1rem",
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        background: "#fff",
      }}
    >
      <div style={{ fontWeight: 600, color: "#111827" }}>{name}</div>
      {location ? (
        <div style={{ color: "#6b7280", fontSize: "0.85rem", lineHeight: 1.4 }}>{location}</div>
      ) : null}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
        {beverageLabel ? (
          <div
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "#7c3aed",
              background: "#f5f3ff",
              borderRadius: 999,
              padding: "0.2rem 0.55rem",
              textTransform: "capitalize",
            }}
          >
            {beverageLabel}
          </div>
        ) : null}
        <div
          style={{
            fontSize: "0.75rem",
            fontWeight: 600,
            color: isDrink ? "#7c3aed" : "#1d4ed8",
            background: isDrink ? "#f5f3ff" : "#eff6ff",
            borderRadius: 999,
            padding: "0.2rem 0.55rem",
          }}
        >
          {statusLabel}
        </div>
      </div>
    </div>
  );
}

export function ClusterPlaceholderSection({ section, showBeverageType = false }) {
  const area = section?.area || "Area";
  const listings = Array.isArray(section?.listings) ? section.listings : [];
  if (listings.length === 0) return null;

  return (
    <section style={{ display: "grid", gap: "0.65rem" }}>
      <h3 style={{ margin: 0, fontSize: "1rem", color: "#111827" }}>{area}</h3>
      <div style={{ display: "grid", gap: "0.65rem" }}>
        {listings.map((listing) => (
          <ClusterPlaceholderListingCard
            key={`${area}-${listing.name}-${listing.location || ""}`}
            listing={listing}
            showBeverageType={showBeverageType}
          />
        ))}
      </div>
    </section>
  );
}

export function ClusterDrinksDirectory({ sections, beverageFilter = "all", onFilterChange }) {
  const filteredSections = filterDrinkSectionsForUi(sections, beverageFilter);
  const visibleCount = countVisibleDrinkListings(filteredSections);

  if (!Array.isArray(sections) || sections.length === 0) return null;

  return (
    <div style={{ display: "grid", gap: "0.85rem" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem" }}>
        {CLUSTER_BEVERAGE_FILTER_OPTIONS.map((option) => {
          const active = option.id === beverageFilter;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onFilterChange?.(option.id)}
              style={{
                padding: "0.35rem 0.7rem",
                borderRadius: 999,
                border: active ? "1px solid #7c3aed" : "1px solid #d1d5db",
                background: active ? "#f5f3ff" : "#fff",
                color: active ? "#6d28d9" : "#374151",
                fontSize: "0.82rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {visibleCount > 0 ? (
        filteredSections.map((section) => (
          <ClusterPlaceholderSection key={`drinks-${section.area}`} section={section} showBeverageType />
        ))
      ) : (
        <p style={{ margin: 0, color: "#6b7280", fontSize: "0.9rem" }}>
          No drink listings match this filter yet.
        </p>
      )}
    </div>
  );
}

const CLUSTER_BEVERAGE_FILTER_OPTIONS = [
  { id: "all", label: "All" },
  { id: "coffee", label: "Coffee" },
  { id: "cocktails", label: "Cocktails" },
  { id: "wine", label: "Wine" },
  { id: "beer", label: "Beer" },
];

function filterDrinkSectionsForUi(sections, beverageFilter) {
  const normalizedFilter = String(beverageFilter || "all").trim().toLowerCase();
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

function countVisibleDrinkListings(sections) {
  return (Array.isArray(sections) ? sections : []).reduce(
    (sum, section) => sum + (Array.isArray(section?.listings) ? section.listings.length : 0),
    0
  );
}

