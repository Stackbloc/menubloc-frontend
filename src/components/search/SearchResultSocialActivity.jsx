/**
 * ConnectActivityModule — Connect Wants / Wants-to-Try on a ranked search card.
 * Reads `row.social_activity` from Search. Does not fetch, infer, or rank.
 * Optional Invite CTA only when the projection supplies cta_label + cta_href
 * (never invent a dead button — Working Features Only).
 */
export default function SearchResultSocialActivity({ items }) {
  const list = Array.isArray(items)
    ? items.filter((row) => row && String(row.line || "").trim())
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
              fontWeight: 650,
              lineHeight: 1.35,
              color: "#86EFAC",
            }}
          >
            <span style={{ minWidth: 0 }}>{row.line}</span>
            {showCta ? (
              <a
                href={ctaHref}
                data-testid="search-result-social-cta"
                style={{
                  flexShrink: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  height: 26,
                  padding: "0 10px",
                  borderRadius: 6,
                  background: "rgba(34,197,94,0.15)",
                  color: "#86EFAC",
                  fontSize: 12,
                  fontWeight: 800,
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
