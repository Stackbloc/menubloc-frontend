/**
 * Restaurant Highlights — selling-point chips from real attributes only.
 * Cuisine, category, type, cluster, services, status banners, founded.
 * Signature/Featured and About live in separate sections. Collapses when empty.
 */
import { Link } from "react-router-dom";
import RestaurantStatusBannerStrip from "../RestaurantStatusBannerStrip.jsx";
import { clusterTypeLabel } from "../../../lib/clusterUrl.js";
import { resolveStatusBanners } from "../../../lib/restaurantStatusBanners.js";
import {
  firstNonEmpty,
  humanizeRestaurantType,
  PROFILE_GREEN,
  PROFILE_INK,
  PROFILE_MUTED,
} from "./profilePrimitives.jsx";

function AttributeChip({ children, href, testId }) {
  if (!children) return null;
  const style = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "7px 12px",
    borderRadius: 999,
    border: "1px solid #d6d3d1",
    background: "#fafaf9",
    color: PROFILE_INK,
    fontSize: 12,
    fontWeight: 700,
    lineHeight: 1.2,
    textDecoration: "none",
  };
  if (href) {
    return (
      <Link
        to={href}
        data-testid={testId}
        style={{ ...style, borderColor: "#bbf7d0", background: "#ecfdf5", color: PROFILE_GREEN }}
      >
        {children}
      </Link>
    );
  }
  return (
    <span data-testid={testId} style={style}>
      {children}
    </span>
  );
}

export default function ProfileRestaurantHighlights({
  foundedText = "",
  landmarks = "",
  cuisine = "",
  category = "",
  restaurantType = "",
  venueType = "",
  featureLabels = [],
  pickup = false,
  delivery = false,
  dineIn = false,
  statusBanners = null,
  statusEventPresentations = null,
  displayCluster = null,
  title = "Restaurant highlights",
  isMobile = false,
}) {
  const founded = firstNonEmpty(foundedText);
  const nearby = firstNonEmpty(landmarks);
  const cuisineLabel = firstNonEmpty(cuisine);
  const categoryLabel = firstNonEmpty(category);
  const venueLabel = firstNonEmpty(venueType);
  const typeLabel = venueLabel ? "" : humanizeRestaurantType(restaurantType);
  const banners = resolveStatusBanners(statusBanners);
  const presentations = Array.isArray(statusEventPresentations) ? statusEventPresentations : [];
  const hasCluster = Boolean(displayCluster?.name && displayCluster?.public_url);
  const features = Array.isArray(featureLabels) ? featureLabels.map((f) => String(f || "").trim()).filter(Boolean) : [];

  const chips = [];
  if (venueLabel) chips.push({ key: "venue", label: venueLabel, testId: "profile-chip-venue" });
  if (cuisineLabel) chips.push({ key: "cuisine", label: cuisineLabel, testId: "profile-chip-cuisine" });
  if (categoryLabel && categoryLabel.toLowerCase() !== cuisineLabel.toLowerCase() && categoryLabel.toLowerCase() !== venueLabel.toLowerCase()) {
    chips.push({ key: "category", label: categoryLabel, testId: "profile-chip-category" });
  }
  if (typeLabel && typeLabel.toLowerCase() !== categoryLabel.toLowerCase()) {
    chips.push({ key: "type", label: typeLabel, testId: "profile-chip-type" });
  }
  if (hasCluster) {
    chips.push({
      key: "cluster",
      label: `${displayCluster.name}${
        displayCluster.cluster_type ? ` · ${clusterTypeLabel(displayCluster.cluster_type)}` : ""
      }`,
      href: displayCluster.public_url,
      testId: "profile-chip-cluster",
    });
  }
  for (const feat of features.slice(0, 6)) {
    if (chips.some((c) => String(c.label).toLowerCase() === feat.toLowerCase())) continue;
    chips.push({ key: `feat-${feat}`, label: feat, testId: `profile-chip-feature` });
  }
  if (pickup && !features.some((f) => /pickup/i.test(f))) {
    chips.push({ key: "pickup", label: "Pickup", testId: "profile-chip-pickup" });
  }
  if (delivery && !features.some((f) => /delivery/i.test(f))) {
    chips.push({ key: "delivery", label: "Delivery", testId: "profile-chip-delivery" });
  }
  if (dineIn && !features.some((f) => /dine/i.test(f))) {
    chips.push({ key: "dine_in", label: "Dine-in", testId: "profile-chip-dine-in" });
  }
  if (founded) chips.push({ key: "founded", label: `Established ${founded}`, testId: "profile-founded" });
  for (const banner of banners) {
    if (banner.id === "now_hiring") continue; // dedicated Now Hiring module
    chips.push({
      key: banner.id,
      label: `${banner.emoji} ${banner.label}`,
      testId: banner.id === "now_hiring" ? "profile-now-hiring" : `profile-chip-${banner.id}`,
    });
  }

  const hasAny = chips.length || presentations.length || nearby;
  if (!hasAny) return null;

  return (
    <section
      data-testid="profile-restaurant-highlights"
      aria-label={title}
      style={{
        marginBottom: isMobile ? 16 : 0,
        padding: isMobile ? "16px 14px" : "18px 18px",
        borderRadius: 16,
        background: "#fff",
        border: "1px solid #e7e5e4",
        boxShadow: "0 8px 28px rgba(28, 25, 23, 0.04)",
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: 0.8,
          textTransform: "uppercase",
          color: PROFILE_GREEN,
          marginBottom: 12,
        }}
      >
        {title}
      </div>

      {chips.length ? (
        <div
          data-testid="profile-highlight-chips"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: presentations.length || nearby ? 14 : 0,
          }}
        >
          {chips.map((chip) => (
            <AttributeChip key={chip.key} href={chip.href} testId={chip.testId}>
              {chip.label}
            </AttributeChip>
          ))}
        </div>
      ) : null}

      {presentations.length ? (
        <div data-testid="profile-announcements" style={{ marginBottom: nearby ? 12 : 0 }}>
          <RestaurantStatusBannerStrip
            variant="aside"
            statusBanners={[]}
            statusEventPresentations={presentations}
          />
        </div>
      ) : null}

      {nearby ? (
        <div data-testid="profile-nearby" style={{ fontSize: 13, lineHeight: 1.5, color: PROFILE_MUTED }}>
          <span style={{ fontWeight: 700, color: "#57534e" }}>Nearby · </span>
          {nearby}
        </div>
      ) : null}
    </section>
  );
}
