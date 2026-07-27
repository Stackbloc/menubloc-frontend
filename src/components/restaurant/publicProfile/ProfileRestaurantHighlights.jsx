/**
 * Restaurant Highlights — About Us, Featured Dish, and other listing story fields.
 * Collapses entirely when nothing real is present.
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

function FieldBlock({ label, children, testId }) {
  if (children == null || children === false || children === "") return null;
  return (
    <div data-testid={testId} style={{ marginBottom: 18 }}>
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
        {label}
      </div>
      <div style={{ fontSize: 15, lineHeight: 1.65, color: PROFILE_INK }}>{children}</div>
    </div>
  );
}

function DishBlock({ item, fallbackName }) {
  const name = String(item?.name || fallbackName || "").trim();
  if (!name) return null;
  const description = String(item?.description || "").trim();
  const price = String(item?.price || "").trim();
  return (
    <div
      style={{
        padding: "12px 14px",
        borderRadius: 12,
        background: "#fafaf9",
        border: "1px solid #e7e5e4",
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 800, color: PROFILE_INK, lineHeight: 1.3 }}>
        {name}
        {price ? (
          <span style={{ marginLeft: 8, fontSize: 14, fontWeight: 600, color: PROFILE_MUTED }}>
            {price}
          </span>
        ) : null}
      </div>
      {description ? (
        <div style={{ marginTop: 6, fontSize: 14, color: "#57534e", lineHeight: 1.5 }}>
          {description}
        </div>
      ) : null}
    </div>
  );
}

function NowHiringBlock({ banners }) {
  const hiring = resolveStatusBanners(banners).find((b) => b.id === "now_hiring");
  if (!hiring) return null;
  return (
    <div
      data-testid="profile-now-hiring"
      style={{
        marginBottom: 18,
        padding: "14px 16px",
        borderRadius: 12,
        border: `1px solid ${hiring.border}`,
        background: hiring.background,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <span aria-hidden="true">{hiring.emoji}</span>
        <div
          style={{
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: 0.3,
            color: hiring.accent,
            textTransform: "uppercase",
          }}
        >
          {hiring.label}
        </div>
      </div>
      <div style={{ fontSize: 14, lineHeight: 1.5, color: PROFILE_INK }}>
        This restaurant is hiring. Ask the team or check their website for openings.
      </div>
    </div>
  );
}

export default function ProfileRestaurantHighlights({
  aboutText = "",
  featuredItem = null,
  featuredText = "",
  foundedText = "",
  landmarks = "",
  dealItems = [],
  statusBanners = null,
  statusEventPresentations = null,
  displayCluster = null,
  isMobile = false,
}) {
  const about = firstNonEmpty(aboutText);
  const featuredName = featuredItem?.name || featuredText || "";
  const founded = firstNonEmpty(foundedText);
  const nearby = firstNonEmpty(landmarks);
  const deals = Array.isArray(dealItems) ? dealItems : [];
  const banners = Array.isArray(statusBanners) ? statusBanners : [];
  const presentations = Array.isArray(statusEventPresentations) ? statusEventPresentations : [];
  const nonHiringBanners = banners.filter((id) => String(id) !== "now_hiring");
  const hasAnnouncements = nonHiringBanners.length > 0 || presentations.length > 0;
  const hasHiring = banners.some((id) => String(id) === "now_hiring");
  const hasCluster = Boolean(displayCluster?.name && displayCluster?.public_url);

  const hasAny =
    about ||
    featuredName ||
    founded ||
    nearby ||
    deals.length ||
    hasHiring ||
    hasAnnouncements ||
    hasCluster;

  if (!hasAny) return null;

  return (
    <section
      data-testid="profile-restaurant-highlights"
      aria-label="Restaurant highlights"
      style={{
        marginBottom: isMobile ? 20 : 0,
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
        Restaurant highlights
      </div>

      <NowHiringBlock banners={banners} />

      <FieldBlock label="About Us" testId="profile-about-us">
        {about || null}
      </FieldBlock>

      <FieldBlock label="Featured Dish" testId="profile-featured-dish">
        <DishBlock item={featuredItem} fallbackName={featuredText} />
      </FieldBlock>

      <FieldBlock label="Founded" testId="profile-founded">
        {founded || null}
      </FieldBlock>

      {deals.length ? (
        <FieldBlock label="Deals & updates" testId="profile-deals">
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {deals.map((deal, idx) => (
              <li key={deal.id ?? `deal-${idx}`} style={{ padding: "4px 0" }}>
                <span style={{ fontWeight: 600 }}>{deal.name}</span>
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
        </FieldBlock>
      ) : null}

      {hasAnnouncements ? (
        <FieldBlock label="Announcements" testId="profile-announcements">
          <RestaurantStatusBannerStrip
            variant="aside"
            statusBanners={nonHiringBanners}
            statusEventPresentations={presentations}
          />
        </FieldBlock>
      ) : null}

      <FieldBlock label="Nearby" testId="profile-nearby">
        {nearby || null}
      </FieldBlock>

      {hasCluster ? (
        <FieldBlock label="Cluster" testId="profile-cluster">
          <Link
            to={displayCluster.public_url}
            style={{ color: PROFILE_GREEN, textDecoration: "none", fontWeight: 600 }}
          >
            {displayCluster.name}
            {displayCluster.cluster_type
              ? ` · ${clusterTypeLabel(displayCluster.cluster_type)}`
              : ""}
          </Link>
        </FieldBlock>
      ) : null}
    </section>
  );
}
