import DinerAvatar from "../social/DinerAvatar.jsx";

/**
 * ConnectActivityModule — one primary Connect line on a ranked search card
 * (review > invite candidate > Like), with the person's avatar. One row, no background.
 * Reads `row.social_activity` from Search. Does not fetch, infer, or rank.
 * Optional Invite CTA only when the projection supplies cta_label + cta_href
 * (never invent a dead button — Working Features Only).
 */
export default function SearchResultSocialActivity({ items }) {
  const list = Array.isArray(items)
    ? items.filter((row) => row && String(row.line || "").trim()).slice(0, 1)
    : [];
  if (!list.length) return null;

  return (
    <ul
      data-testid="search-result-social-activity"
      data-enrichment-module="connect"
      style={{
        listStyle: "none",
        margin: "8px 0 0",
        padding: 0,
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      {list.map((row) => {
        const ctaLabel = String(row.cta_label || "").trim();
        const ctaHref = String(row.cta_href || row.cta_url || "").trim();
        const showCta = Boolean(ctaLabel && ctaHref);
        return (
          <li
            key={row.activity_id || `${row.kind}:${row.source_id}`}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              fontSize: 13,
              fontWeight: 600,
              lineHeight: 1.35,
              color: "#C0C8D5",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <DinerAvatar
                avatarUrl={row.avatar_url}
                displayName={row.display_name}
                size={20}
                title={null}
              />
              <span
                style={{
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {row.line}
              </span>
            </span>
            {showCta ? (
              <a
                href={ctaHref}
                data-testid="search-result-social-cta"
                style={{
                  // Outlined pill — same shape as the Nutrition / Similar Items chips.
                  flexShrink: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  borderRadius: 999,
                  padding: "4px 10px",
                  border: "1px solid var(--gb-color-accent)",
                  background: "transparent",
                  color: "var(--gb-color-accent)",
                  fontSize: 12,
                  fontWeight: 700,
                  lineHeight: 1,
                  textDecoration: "none",
                }}
              >
                {ctaLabel}
              </a>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
