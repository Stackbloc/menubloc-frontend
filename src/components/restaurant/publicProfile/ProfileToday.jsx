/**
 * "Today at [Restaurant]" — one card for what the owner wants diners to know now:
 * active profile updates (owner free text; "Today only" posts end at midnight) followed by
 * active deals with a 🔥 Deal badge. Hidden when both are empty (2026-10-21).
 * Deals stay structured deal_items — they still feed the header Deals page and search ranking.
 */
import { Link } from "react-router-dom";
import { ProfileDealRows } from "./ProfileDealsSection.jsx";
import { ProfileUpdateRows } from "./ProfileUpdates.jsx";
import {
  PROFILE_INK,
  profileAccentVar,
  firstNonEmpty,
  profileReadableSurfaceStyle,
} from "./profilePrimitives.jsx";

export default function ProfileToday({
  name = "",
  updates = [],
  dealItems = [],
  restaurantId = null,
  isMobile = false,
}) {
  const posts = (Array.isArray(updates) ? updates : []).filter((u) => String(u?.title || "").trim());
  const deals = (Array.isArray(dealItems) ? dealItems : []).filter((d) =>
    firstNonEmpty(d?.deal_title, d?.name, d?.title)
  );
  if (!posts.length && !deals.length) return null;

  const placeName = String(name || "").trim();
  const heading = placeName ? `Today at ${placeName}` : "Today";
  const dealsHref = restaurantId
    ? `/deals?restaurant_id=${encodeURIComponent(String(restaurantId))}`
    : "/deals";

  return (
    <section
      data-testid="profile-today"
      data-profile-surface="card"
      aria-label={heading}
      style={profileReadableSurfaceStyle({
        marginBottom: isMobile ? 20 : 28,
      })}
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
        <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 0.4, color: PROFILE_INK }}>
          {heading}
        </div>
        {deals.length > 5 ? (
          <Link
            to={dealsHref}
            style={{ fontSize: 13, fontWeight: 700, color: profileAccentVar, textDecoration: "none" }}
          >
            All deals
          </Link>
        ) : null}
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {posts.length ? <ProfileUpdateRows updates={posts} /> : null}
        {deals.length ? <ProfileDealRows deals={deals} placement="profile_today" badge /> : null}
      </div>
    </section>
  );
}
