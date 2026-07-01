import { useEffect, useRef } from "react";
import DiscoveryCard from "../discovery/DiscoveryCard.jsx";
import { StatusMessage } from "../grubbid/GrubbidPrimitives.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";

function SponsoredBadge({ label }) {
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      padding: "2px 8px",
      borderRadius: 999,
      fontSize: 10,
      fontWeight: 800,
      letterSpacing: "0.04em",
      textTransform: "uppercase",
      background: "rgba(234, 179, 8, 0.18)",
      color: "#a16207",
      border: "1px solid rgba(234, 179, 8, 0.35)",
    }}>
      {label}
    </span>
  );
}

function MenuBrowserCard({ menu, sponsored = false }) {
  const { t } = useLanguage();
  const dealTitle = menu?.sponsored_deal?.title || null;

  return (
    <div style={{ position: "relative" }}>
      {(sponsored || menu?.is_sponsored) ? (
        <div style={{
          position: "absolute",
          top: 10,
          left: 10,
          right: 10,
          zIndex: 2,
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          pointerEvents: "none",
        }}>
          <SponsoredBadge label={menu?.sponsored_label || t("menuBrowser.sponsored", "Sponsored")} />
          {dealTitle ? (
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "2px 8px",
              borderRadius: 999,
              fontSize: 10,
              fontWeight: 800,
              background: "rgba(239, 68, 68, 0.16)",
              color: "#fecaca",
              border: "1px solid rgba(239, 68, 68, 0.35)",
              maxWidth: "100%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
              {dealTitle}
            </span>
          ) : null}
        </div>
      ) : null}
      <DiscoveryCard menu={menu} paneVariant="featured" />
    </div>
  );
}

export default function MenuBrowserCategoryFeed({
  title,
  menus,
  loading,
  loadingMore,
  error,
  hasMore,
  onLoadMore,
  sponsoredPlacements = [],
}) {
  const { t } = useLanguage();
  const sentinelRef = useRef(null);

  useEffect(() => {
    if (!hasMore || loading || loadingMore) return undefined;
    const node = sentinelRef.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) onLoadMore?.();
      },
      { rootMargin: "240px 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, onLoadMore]);

  const sponsoredIds = new Set(
    (Array.isArray(sponsoredPlacements) ? sponsoredPlacements : [])
      .map((row) => Number(row?.restaurant_id))
      .filter(Boolean)
  );

  const showEmpty = !loading && !error && menus.length === 0;

  return (
    <div>
      <div style={{ marginBottom: 18, padding: "0 4px" }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: "var(--gb-color-ink-strong)" }}>
          {title}
        </h1>
        <p style={{ margin: "6px 0 0", fontSize: 14, color: "var(--gb-color-ink-soft)" }}>
          {t("menuBrowser.categoryHint", "Tap any menu to open the full restaurant menu.")}
        </p>
      </div>

      {loading ? (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 14,
        }}>
          {[0, 1, 2, 3, 4, 5].map((card) => (
            <div key={card} style={{ height: 168, borderRadius: 16, background: "#1F2937", opacity: 0.35 }} />
          ))}
        </div>
      ) : null}

      {(error || showEmpty) ? (
        <StatusMessage tone="muted">
          <strong style={{ display: "block", marginBottom: 8 }}>
            {t("menuBrowser.emptyTitle", "No menus in this category yet")}
          </strong>
          {error || t("menuBrowser.emptyBody", "Try another category or check back as we add more menus.")}
        </StatusMessage>
      ) : null}

      {!loading && menus.length > 0 ? (
        <>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 14,
          }}>
            {menus.map((menu, index) => (
              <MenuBrowserCard
                key={String(menu?.menu_id ?? menu?.restaurant_id ?? index)}
                menu={menu}
                sponsored={sponsoredIds.has(Number(menu?.restaurant_id)) || menu?.is_sponsored === true}
              />
            ))}
          </div>
          {hasMore ? (
            <div ref={sentinelRef} style={{ height: 24, marginTop: 12 }} aria-hidden="true" />
          ) : null}
          {loadingMore ? (
            <div style={{ textAlign: "center", padding: "16px 0", color: "var(--gb-color-ink-muted)", fontSize: 13 }}>
              {t("common.loading", "Loading…")}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
