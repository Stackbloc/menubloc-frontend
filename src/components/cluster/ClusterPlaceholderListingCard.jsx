function placeholderStatusLabel(status) {
  const normalized = String(status || "").trim().toLowerCase();
  if (normalized === "menu_pending") {
    return "Menu data in progress";
  }
  if (normalized === "pending_verification") {
    return "Listing pending verification";
  }
  return "Menu coming soon";
}

export default function ClusterPlaceholderListingCard({ listing }) {
  const name = listing?.name || "Unnamed listing";
  const location = listing?.location ? String(listing.location).trim() : "";
  const statusLabel = placeholderStatusLabel(listing?.status);

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
      <div
        style={{
          alignSelf: "flex-start",
          fontSize: "0.75rem",
          fontWeight: 600,
          color: "#1d4ed8",
          background: "#eff6ff",
          borderRadius: 999,
          padding: "0.2rem 0.55rem",
        }}
      >
        {statusLabel}
      </div>
    </div>
  );
}

export function ClusterPlaceholderSection({ section }) {
  const area = section?.area || "Area";
  const listings = Array.isArray(section?.listings) ? section.listings : [];
  if (listings.length === 0) return null;

  return (
    <section style={{ display: "grid", gap: "0.65rem" }}>
      <h3 style={{ margin: 0, fontSize: "1rem", color: "#111827" }}>{area}</h3>
      <div style={{ display: "grid", gap: "0.65rem" }}>
        {listings.map((listing) => (
          <ClusterPlaceholderListingCard key={`${area}-${listing.name}`} listing={listing} />
        ))}
      </div>
    </section>
  );
}
