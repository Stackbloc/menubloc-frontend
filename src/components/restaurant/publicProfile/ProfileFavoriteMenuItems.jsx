/**
 * Favorite Menu Items — up to 3 owner-curated dishes.
 * Tap opens menu item detail. Menu access is the header icon beside the restaurant name.
 */
import { Link } from "react-router-dom";
import {
  PROFILE_INK,
  PROFILE_MUTED,
  profileCardBorderVar,
  firstNonEmpty,
  ProfileSectionBlank,
} from "./profilePrimitives.jsx";

function formatItemPrice(raw) {
  if (raw == null || raw === "") return "";
  const n = Number(raw);
  if (Number.isFinite(n)) {
    return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
  }
  const s = String(raw).trim();
  if (!s || s === "0" || s === "0.00") return "";
  return s.startsWith("$") ? s : `$${s}`;
}

function itemDetailHref(item) {
  const id = item?.menu_item_id ?? item?.id;
  if (id == null || id === "") return null;
  const source = String(item?.source || "").toLowerCase();
  const routeId = source === "ck" || String(id).startsWith("cmi:") ? String(id) : String(id);
  return `/menu-items/${encodeURIComponent(routeId)}?from=profile`;
}

export default function ProfileFavoriteMenuItems({
  items = [],
  isMobile = false,
  showClaimInvites = false,
}) {
  const list = (Array.isArray(items) ? items : [])
    .filter((it) => firstNonEmpty(it?.name))
    .slice(0, 3);
  if (!list.length && !showClaimInvites) return null;

  return (
    <section
      data-testid="profile-favorite-menu-items"
      aria-label="Favorite Menu Items"
      style={{ marginBottom: isMobile ? 20 : 28 }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 800,
          letterSpacing: 0.4,
          color: PROFILE_INK,
          marginBottom: 12,
        }}
      >
        Favorite Menu Items
      </div>
      {!list.length ? (
        <ProfileSectionBlank
          testId="profile-favorites-blank"
          message="No favorite menu items yet. Feature up to 3 dishes."
        />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))",
            gap: 12,
          }}
        >
          {list.map((item) => {
            const href = itemDetailHref(item);
            const price = formatItemPrice(item.price);
            const img = String(item.image_url || item.photo_url || "").trim();
            const card = (
              <div
                data-testid="profile-favorite-item"
                style={{
                  borderRadius: 14,
                  overflow: "hidden",
                  border: `1px solid ${profileCardBorderVar}`,
                  background: "#fff",
                  height: "100%",
                }}
              >
                <div
                  style={{
                    height: isMobile ? 140 : 120,
                    background: img
                      ? `center / cover no-repeat url(${JSON.stringify(img)})`
                      : "linear-gradient(145deg, #f5f5f4, #e7e5e4)",
                  }}
                />
                <div style={{ padding: "12px 14px" }}>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 800,
                      color: PROFILE_INK,
                      lineHeight: 1.3,
                    }}
                  >
                    {item.name}
                  </div>
                  {price ? (
                    <div style={{ marginTop: 4, fontSize: 14, fontWeight: 600, color: PROFILE_MUTED }}>
                      {price}
                    </div>
                  ) : null}
                </div>
              </div>
            );
            return href ? (
              <Link
                key={item.id || item.name}
                to={href}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                {card}
              </Link>
            ) : (
              <div key={item.id || item.name}>{card}</div>
            );
          })}
        </div>
      )}
    </section>
  );
}
