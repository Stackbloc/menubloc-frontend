/**
 * Restaurant / food-truck Highlights — marketing summary, not a field dump.
 * Signature dish → attribute chips → About → deals. Collapses when empty.
 */
import { Link } from "react-router-dom";
import RestaurantStatusBannerStrip from "../RestaurantStatusBannerStrip.jsx";
import { clusterTypeLabel } from "../../../lib/clusterUrl.js";
import { resolveStatusBanners } from "../../../lib/restaurantStatusBanners.js";
import {
  firstNonEmpty,
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
    padding: "6px 12px",
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
      <Link to={href} data-testid={testId} style={{ ...style, borderColor: "#bbf7d0", background: "#ecfdf5", color: PROFILE_GREEN }}>
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

function SignatureDish({ item, fallbackName }) {
  const name = String(item?.name || fallbackName || "").trim();
  if (!name) return null;
  const description = String(item?.description || "").trim();
  const price = String(item?.price || "").trim();
  return (
    <div
      data-testid="profile-featured-dish"
      style={{
        marginBottom: 18,
        padding: "16px 16px",
        borderRadius: 14,
        background: "linear-gradient(135deg, #fafaf9 0%, #f5f5f4 100%)",
        border: "1px solid #e7e5e4",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: 0.7,
          textTransform: "uppercase",
          color: PROFILE_GREEN,
          marginBottom: 8,
        }}
      >
        Signature Dish
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color: PROFILE_INK, lineHeight: 1.25, letterSpacing: "-0.02em" }}>
        {name}
        {price ? (
          <span style={{ marginLeft: 10, fontSize: 15, fontWeight: 600, color: PROFILE_MUTED }}>
            {price}
          </span>
        ) : null}
      </div>
      {description ? (
        <div style={{ marginTop: 8, fontSize: 14, color: "#57534e", lineHeight: 1.55 }}>
          {description}
        </div>
      ) : null}
    </div>
  );
}

export default function ProfileRestaurantHighlights({
  aboutText = "",
  featuredItem = null,
  featuredText = "",
  foundedText = "",
  landmarks = "",
  cuisine = "",
  includeCuisineChip = false,
  dealItems = [],
  statusBanners = null,
  statusEventPresentations = null,
  displayCluster = null,
  title = "Restaurant highlights",
  isMobile = false,
}) {
  const about = firstNonEmpty(aboutText);
  const featuredName = featuredItem?.name || featuredText || "";
  const founded = firstNonEmpty(foundedText);
  const nearby = firstNonEmpty(landmarks);
  const cuisineLabel = includeCuisineChip ? firstNonEmpty(cuisine) : "";
  const deals = Array.isArray(dealItems) ? dealItems : [];
  const banners = resolveStatusBanners(statusBanners);
  const presentations = Array.isArray(statusEventPresentations) ? statusEventPresentations : [];
  const hasCluster = Boolean(displayCluster?.name && displayCluster?.public_url);

  const chips = [];
  if (cuisineLabel) chips.push({ key: "cuisine", label: cuisineLabel, testId: "profile-chip-cuisine" });
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
  if (founded) chips.push({ key: "founded", label: `Established ${founded}`, testId: "profile-founded" });
  for (const banner of banners) {
    chips.push({
      key: banner.id,
      label: `${banner.emoji} ${banner.label}`,
      testId: banner.id === "now_hiring" ? "profile-now-hiring" : `profile-chip-${banner.id}`,
    });
  }

  const hasAny =
    featuredName ||
    about ||
    nearby ||
    deals.length ||
    chips.length ||
    presentations.length;

  if (!hasAny) return null;

  return (
    <section
      data-testid="profile-restaurant-highlights"
      aria-label={title}
      style={{
        marginBottom: isMobile ? 16 : 0,
        padding: isMobile ? "18px 16px" : "22px 22px",
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
          marginBottom: 14,
        }}
      >
        {title}
      </div>

      <SignatureDish item={featuredItem} fallbackName={featuredText} />

      {chips.length ? (
        <div
          data-testid="profile-highlight-chips"
          style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: about || deals.length || nearby || presentations.length ? 16 : 0 }}
        >
          {chips.map((chip) => (
            <AttributeChip key={chip.key} href={chip.href} testId={chip.testId}>
              {chip.label}
            </AttributeChip>
          ))}
        </div>
      ) : null}

      {about ? (
        <div data-testid="profile-about-us" style={{ marginBottom: deals.length || nearby || presentations.length ? 16 : 0 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 0.6,
              textTransform: "uppercase",
              color: PROFILE_MUTED,
              marginBottom: 6,
            }}
          >
            About Us
          </div>
          <div style={{ fontSize: 15, lineHeight: 1.7, color: "#44403c" }}>{about}</div>
        </div>
      ) : null}

      {deals.length ? (
        <div data-testid="profile-deals" style={{ marginBottom: nearby || presentations.length ? 16 : 0 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 0.6,
              textTransform: "uppercase",
              color: PROFILE_MUTED,
              marginBottom: 8,
            }}
          >
            Featured promotion
          </div>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {deals.map((deal, idx) => (
              <li key={deal.id ?? `deal-${idx}`} style={{ padding: "6px 0" }}>
                <span style={{ fontWeight: 700, color: PROFILE_INK }}>{deal.name}</span>
                {deal.price ? (
                  <span style={{ marginLeft: 8, color: PROFILE_MUTED, fontSize: 13 }}>
                    {deal.price}
                  </span>
                ) : null}
                {deal.description ? (
                  <div style={{ fontSize: 13, color: PROFILE_MUTED, marginTop: 2 }}>
                    {deal.description}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {presentations.length ? (
        <div data-testid="profile-announcements" style={{ marginBottom: nearby ? 16 : 0 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 0.6,
              textTransform: "uppercase",
              color: PROFILE_MUTED,
              marginBottom: 8,
            }}
          >
            Announcements
          </div>
          <RestaurantStatusBannerStrip
            variant="aside"
            statusBanners={[]}
            statusEventPresentations={presentations}
          />
        </div>
      ) : null}

      {nearby ? (
        <div data-testid="profile-nearby">
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 0.6,
              textTransform: "uppercase",
              color: PROFILE_MUTED,
              marginBottom: 6,
            }}
          >
            Nearby
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.55, color: "#57534e" }}>{nearby}</div>
        </div>
      ) : null}
    </section>
  );
}
