import { Link } from "react-router-dom";
import InviteToEatButton from "../../../components/InviteToEatButton.jsx";
import { restaurantPathFromRow } from "../../../lib/canonicalUrl.js";
import { resolveConsumerMediaUrl } from "../../../lib/consumerApi.js";
import * as s from "./myMenuplyStyles.js";

export function restaurantHref(row) {
  return restaurantPathFromRow(row) || (row?.restaurant_id ? `/restaurants/${row.restaurant_id}` : null);
}

export function foodHref(item) {
  if (item?.menu_item_id) return `/menu-items/${item.menu_item_id}`;
  if (item?.menu_item_href) return item.menu_item_href;
  if (item?.diary_href) return item.diary_href;
  if (item?.kind === "what_i_ate") return "/account/what-i-ate";
  return restaurantHref(item) || "/account/what-i-ate";
}

export function SectionHead({ title, to, testId }) {
  return (
    <div style={s.row} data-testid={testId}>
      <h2 style={s.sectionTitle}>
        {to ? (
          <Link to={to} style={s.sectionTitleLink}>
            {title}
          </Link>
        ) : (
          title
        )}
      </h2>
    </div>
  );
}

export function PhotoGrid({ items, empty }) {
  if (!items.length) return <p style={s.muted}>{empty}</p>;
  return (
    <div style={s.grid}>
      {items.map((item) => (
        <Link key={item.id || item.menu_item_id || item.food_name} to={foodHref(item)} style={s.photoCard}>
          {item.photo_url ? (
            <img src={resolveConsumerMediaUrl(item.photo_url)} alt="" style={s.photo} />
          ) : (
            <div style={{ ...s.photo, display: "grid", placeItems: "center", fontSize: 22 }}>🍽️</div>
          )}
          <div style={s.photoLabel}>{item.food_name || item.item_name || item.itemName || "Food"}</div>
        </Link>
      ))}
    </div>
  );
}

export function ConnectionFoodCard({ item }) {
  const name = item.peer?.display_name || "A diner";
  const restaurantName = item.restaurant_name;
  const joinHref = item.join_me_href;
  return (
    <div style={s.card} data-testid="connections-eating-card">
      <strong style={{ display: "block", fontSize: 14 }}>{name}</strong>
      <Link to={foodHref(item)} style={{ ...s.link, display: "block", marginTop: 8 }}>
        {item.photo_url ? (
          <img
            src={resolveConsumerMediaUrl(item.photo_url)}
            alt=""
            style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 10 }}
          />
        ) : null}
        <span style={{ display: "block", marginTop: 8, color: "#0B0F0C", fontWeight: 800 }}>
          {item.food_name}
        </span>
      </Link>
      {restaurantName ? (
        <Link to={restaurantHref(item) || "#"} style={{ ...s.muted, display: "block", marginTop: 4, color: "#667085" }}>
          {restaurantName}
        </Link>
      ) : null}
      <div style={s.actions}>
        {item.menu_item_id || item.menu_item_href ? (
          <Link to={foodHref(item)} style={s.chipBtn}>
            View Menu Item
          </Link>
        ) : (
          <Link to={foodHref(item)} style={s.chipBtn}>
            View food
          </Link>
        )}
        {joinHref ? (
          <Link to={joinHref} style={s.primaryBtn}>
            Join Me
          </Link>
        ) : item.restaurant_id ? (
          <InviteToEatButton
            restaurantId={item.restaurant_id}
            restaurantName={restaurantName}
            menuItemId={item.menu_item_id}
            menuItemName={item.food_name}
            size="compact"
          />
        ) : null}
      </div>
    </div>
  );
}

export function EatingPlanCard({ plan }) {
  const name = plan.restaurant_name || plan.place_label || plan.title || "Plan";
  const when = formatPlanWhen(plan.plan_date);
  const restHref = restaurantHref({
    restaurant_id: plan.restaurant_id,
    restaurant_slug: plan.restaurant_slug,
    slug: plan.restaurant_slug,
    city: plan.restaurant_city,
    state: plan.restaurant_state,
  });
  return (
    <div style={s.card} data-testid="eating-plan-card">
      <Link to={`/account/what-we-doing/${plan.token}`} style={{ ...s.sectionTitleLink, fontWeight: 800 }}>
        {name}
      </Link>
      {when ? <div style={s.muted}>{when}</div> : null}
      <div style={s.muted}>
        {plan.joinable ? `${plan.joiner_count || 0}/${plan.join_capacity || 0} joined` : "Just me"}
      </div>
      <div style={s.actions}>
        <Link to={`/account/what-we-doing/${plan.token}`} style={s.chipBtn}>
          Plan
        </Link>
        {restHref ? (
          <Link to={restHref} style={s.chipBtn}>
            Restaurant
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export function PlanCard({ item }) {
  const name = item.peer?.display_name || "A diner";
  const when = formatPlanWhen(item.plan_date);
  const place = item.restaurant_name
    ? `Dinner at ${item.restaurant_name}`
    : item.looking_for_place
      ? "Looking for somewhere to eat"
      : item.title;
  return (
    <div style={s.card} data-testid="connections-planning-card">
      <strong style={{ display: "block", fontSize: 14 }}>{name}</strong>
      {when ? <div style={{ marginTop: 4, fontWeight: 800 }}>{when}</div> : null}
      <div style={{ marginTop: 4, color: "#475467", fontSize: 14 }}>{place}</div>
      <div style={s.actions}>
        {item.href ? (
          <Link to={item.href} style={s.chipBtn}>
            View Plan
          </Link>
        ) : null}
        {item.join_me_href ? (
          <Link to={item.join_me_href} style={s.primaryBtn}>
            Join Me
          </Link>
        ) : item.restaurant_id ? (
          <InviteToEatButton
            restaurantId={item.restaurant_id}
            restaurantName={item.restaurant_name}
            size="compact"
          />
        ) : null}
      </div>
    </div>
  );
}

function formatPlanWhen(planDate) {
  const raw = String(planDate || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return "";
  const d = new Date(`${raw}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric", timeZone: "UTC" });
}
