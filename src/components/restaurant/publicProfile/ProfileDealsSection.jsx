/**
 * Active deals from existing deal_items. Hide when empty.
 */
import { Link } from "react-router-dom";
import {
  PROFILE_INK,
  PROFILE_MUTED,
  profileCardBorderVar,
  profileAccentVar,
  firstNonEmpty,
  ProfileSectionBlank,
} from "./profilePrimitives.jsx";

function formatPrice(raw) {
  if (raw == null || raw === "") return "";
  const n = Number(raw);
  if (Number.isFinite(n)) {
    return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
  }
  const s = String(raw).trim();
  return s.startsWith("$") ? s : s ? `$${s}` : "";
}

export default function ProfileDealsSection({
  dealItems = [],
  restaurantId = null,
  isMobile = false,
  showClaimInvites = false,
}) {
  const deals = (Array.isArray(dealItems) ? dealItems : []).filter(
    (d) => firstNonEmpty(d?.deal_title, d?.name, d?.title)
  );
  if (!deals.length && !showClaimInvites) return null;

  const browseHref = restaurantId
    ? `/deals?restaurant_id=${encodeURIComponent(String(restaurantId))}`
    : "/deals";

  return (
    <section
      data-testid="profile-deals-section"
      aria-label="Deals"
      style={{ marginBottom: isMobile ? 20 : 28 }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: 0.4,
            color: PROFILE_INK,
          }}
        >
          Deals
        </div>
        {deals.length ? (
          <Link
            to={browseHref}
            style={{ fontSize: 13, fontWeight: 700, color: profileAccentVar, textDecoration: "none" }}
          >
            See all
          </Link>
        ) : null}
      </div>
      {!deals.length ? (
        <ProfileSectionBlank testId="profile-deals-blank" message="No deals yet." />
      ) : null}
      <div style={{ display: "grid", gap: 8 }}>
        {deals.slice(0, 5).map((deal) => {
          const title = firstNonEmpty(deal.deal_title, deal.title, deal.name);
          const price = formatPrice(deal.price);
          const itemId = deal.menu_item_id || deal.id;
          const href = itemId ? `/menu-items/${encodeURIComponent(String(itemId))}?from=profile` : null;
          const inner = (
            <div
              data-testid="profile-deal-row"
              style={{
                padding: "12px 14px",
                borderRadius: 12,
                border: `1px solid ${profileCardBorderVar}`,
                background: "#fff",
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 700, color: PROFILE_INK }}>{title}</div>
              <div
                style={{
                  marginTop: 4,
                  fontSize: 13,
                  color: PROFILE_MUTED,
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                {deal.name && deal.deal_title ? <span>{deal.name}</span> : null}
                {price ? <span>{price}</span> : null}
              </div>
            </div>
          );
          return href ? (
            <Link key={deal.deal_id || deal.id || title} to={href} style={{ textDecoration: "none" }}>
              {inner}
            </Link>
          ) : (
            <div key={deal.deal_id || deal.id || title}>{inner}</div>
          );
        })}
      </div>
    </section>
  );
}
