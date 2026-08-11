import ClusterAdSlot from "../cluster/ClusterAdSlot.jsx";
import { getMenuBrowserVenueCover } from "../../lib/menuBrowserVenueCover.js";

/**
 * Full-pane sponsored page between Yellow Browser menu pages.
 * Content is centered in the book pane (horizontal + vertical).
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
        alignItems: "center",
        justifyContent: "center",
        overflow: "auto",
        borderRadius: 16,
        background: cover.pageBg,
        color: cover.ink,
        boxSizing: "border-box",
        padding: "24px 16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: cover.accent,
          }}
        >
          Sponsored · {cover.brandLine}
        </div>
        <h2
          style={{
            margin: 0,
            fontSize: "clamp(22px, 5vw, 28px)",
            fontWeight: 900,
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            maxWidth: "20ch",
          }}
        >
          {cover.headline}
        </h2>
        <p
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 600,
            lineHeight: 1.45,
            color: cover.muted,
            maxWidth: "36rem",
          }}
        >
          {cover.subhead}
        </p>
        <div style={{ width: "100%", marginTop: 4 }}>
          <ClusterAdSlot
            clusterSlug={cover.slug}
            pageRegion={pageRegion || "cluster_landing_hero"}
            size="hero"
            style={{ margin: "0 auto", borderRadius: 12, overflow: "hidden" }}
          />
        </div>
        <p
          style={{
            margin: "8px 0 0",
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
    </div>
  );
}
