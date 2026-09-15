/**
 * Deal enrichment module for the unified search-result card.
 * Renders inline in the enrichment stack — not a free-floating deal banner.
 * Temporal validity: expired ends_at → omit.
 */
import { trackBillboardClick } from "../../lib/analytics.js";

const DEAL_TYPE_META = {
  deal: {
    label: "Deal",
    badgeColor: "#FCD34D",
    badgeBg: "rgba(252,211,77,0.12)",
    grad: "linear-gradient(135deg,#92400e,#b45309)",
  },
  event: {
    label: "Event",
    badgeColor: "#C4B5FD",
    badgeBg: "rgba(196,181,253,0.12)",
    grad: "linear-gradient(135deg,#4c1d95,#6d28d9)",
  },
  menu: {
    label: "New",
    badgeColor: "#93C5FD",
    badgeBg: "rgba(147,197,253,0.12)",
    grad: "linear-gradient(135deg,#1e3a5f,#1d4ed8)",
  },
  notice: {
    label: "Notice",
    badgeColor: "#FCA5A5",
    badgeBg: "rgba(252,165,165,0.12)",
    grad: "linear-gradient(135deg,#7f1d1d,#dc2626)",
  },
  announcement: {
    label: "Update",
    badgeColor: "#86EFAC",
    badgeBg: "rgba(134,239,172,0.12)",
    grad: "linear-gradient(135deg,#14532d,#15803d)",
  },
  general: {
    label: "Post",
    badgeColor: "#CBD5E1",
    badgeBg: "rgba(203,213,225,0.12)",
    grad: "linear-gradient(135deg,#1e293b,#475569)",
  },
};

function isTemporallyValid(deal) {
  if (!deal) return false;
  const now = Date.now();
  if (deal.ends_at) {
    const ends = Date.parse(deal.ends_at);
    if (Number.isFinite(ends) && ends < now) return false;
  }
  if (deal.starts_at) {
    const starts = Date.parse(deal.starts_at);
    if (Number.isFinite(starts) && starts > now) return false;
  }
  if (deal.deal_expired === true) return false;
  return true;
}

/**
 * @param {object} props
 * @param {object|null} props.deal - primary_billboard / deal projection payload
 * @param {string|number|null} props.restaurantId
 * @param {string|null} props.restaurantName
 */
export default function SearchResultDealModule({
  deal = null,
  restaurantId = null,
  restaurantName = null,
}) {
  if (!deal || !isTemporallyValid(deal)) return null;
  const meta = DEAL_TYPE_META[deal.post_type] || DEAL_TYPE_META.general;
  const headline = deal.headline || deal.title || "";
  const sub = deal.subheadline || null;
  if (!headline) return null;

  return (
    <div
      data-testid="search-result-deal-module"
      style={{
        marginTop: 10,
        display: "flex",
        alignItems: "center",
        gap: 10,
        borderRadius: 8,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        overflow: "hidden",
        minWidth: 0,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          flexShrink: 0,
          background: deal.image_url ? "#000" : meta.grad,
          position: "relative",
        }}
      >
        {deal.image_url ? (
          <img
            src={deal.image_url}
            alt={deal.image_alt_text || headline}
            loading="lazy"
            style={{
              width: "100%",
              height: "100%",
              objectFit: deal.image_fit || "cover",
              display: "block",
            }}
          />
        ) : null}
      </div>
      <div style={{ flex: 1, minWidth: 0, padding: "8px 10px 8px 0" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: sub ? 2 : 0,
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              height: 16,
              padding: "0 6px",
              borderRadius: 999,
              background: meta.badgeBg,
              color: meta.badgeColor,
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: 0.5,
              textTransform: "uppercase",
              flexShrink: 0,
            }}
          >
            {meta.label}
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#E5E7EB",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {headline}
          </span>
        </div>
        {sub ? (
          <div
            style={{
              fontSize: 11,
              color: "#6B7280",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {sub}
          </div>
        ) : null}
      </div>
      {deal.cta_label && deal.cta_url ? (
        <a
          href={deal.cta_url}
          target="_blank"
          rel="noreferrer"
          onClick={() =>
            trackBillboardClick({
              restaurantId,
              restaurantName,
              billboardId: deal.id || deal.billboard_id || null,
              target: deal.cta_url,
            })
          }
          style={{
            flexShrink: 0,
            display: "inline-flex",
            alignItems: "center",
            height: 28,
            padding: "0 10px",
            marginRight: 10,
            borderRadius: 6,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.10)",
            color: "#E5E7EB",
            fontSize: 11,
            fontWeight: 700,
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          {deal.cta_label}
        </a>
      ) : null}
    </div>
  );
}

export { isTemporallyValid };
