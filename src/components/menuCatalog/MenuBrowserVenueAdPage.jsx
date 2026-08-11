import ClusterAdSlot from "../cluster/ClusterAdSlot.jsx";
import { getMenuBrowserVenueCover } from "../../lib/menuBrowserVenueCover.js";

/**
 * Full-pane sponsored page between Yellow Browser menu pages.
 */
export default function MenuBrowserVenueAdPage({ venueSlug, pageRegion }) {
  const cover = getMenuBrowserVenueCover(venueSlug);

  return (
    <div
      data-testid="menu-browser-venue-ad-page"
      data-venue-slug={cover.slug}
      data-page-region={pageRegion || ""}
      style={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "auto",
        borderRadius: 16,
        background: cover.pageBg,
        color: cover.ink,
        boxSizing: "border-box",
        padding: "18px 14px 24px",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: cover.accent,
          marginBottom: 10,
        }}
      >
        Sponsored · {cover.brandLine}
      </div>
      <h2
        style={{
          margin: "0 0 8px",
          fontSize: "clamp(22px, 5vw, 28px)",
          fontWeight: 900,
          letterSpacing: "-0.03em",
          lineHeight: 1.1,
        }}
      >
        {cover.headline}
      </h2>
      <p
        style={{
          margin: "0 0 16px",
          fontSize: 14,
          fontWeight: 600,
          lineHeight: 1.45,
          color: cover.muted,
          maxWidth: 36rem,
        }}
      >
        {cover.subhead}
      </p>
      <div style={{ flex: "0 0 auto", width: "100%" }}>
        <ClusterAdSlot
          clusterSlug={cover.slug}
          pageRegion={pageRegion || "cluster_landing_hero"}
          size="hero"
          style={{ margin: 0, borderRadius: 12, overflow: "hidden" }}
        />
      </div>
      <p
        style={{
          marginTop: "auto",
          paddingTop: 16,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: cover.muted,
        }}
      >
        Swipe for the next menu →
      </p>
    </div>
  );
}
