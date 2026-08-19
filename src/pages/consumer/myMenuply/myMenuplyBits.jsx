import { Link } from "react-router-dom";
import { useMemo, useRef, useState } from "react";
import InviteToEatButton from "../../../components/InviteToEatButton.jsx";
import { restaurantPathFromRow } from "../../../lib/canonicalUrl.js";
import { resolveConsumerMediaUrl } from "../../../lib/consumerApi.js";
import {
  compareMealPeriod,
  normalizeWhatIAteMealPeriod,
} from "../../../lib/whatIAteTodayMealPeriod.js";
import {
  formatEatingCaption,
  formatFuturePlanRowLabel,
  futurePlanDetailParts,
  planJoinHref,
} from "./dinerHubFormat.js";
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

export function SectionHead({ title, to, testId, aside = null }) {
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
      {aside}
    </div>
  );
}

export function PhotoGrid({ items, onSelect, onPhotoPick, hideJoinMe = false }) {
  const ordered = useMemo(
    () =>
      [...(items || [])].sort((a, b) =>
        compareMealPeriod(
          normalizeWhatIAteMealPeriod(a.meal_period),
          normalizeWhatIAteMealPeriod(b.meal_period)
        )
      ),
    [items]
  );
  const [index, setIndex] = useState(0);
  const [photoHover, setPhotoHover] = useState(false);
  const fileRef = useRef(null);
  if (!ordered.length) return null;
  const safeIndex = Math.min(index, ordered.length - 1);
  const item = ordered[safeIndex];
  const label = item.food_name || item.item_name || item.itemName || "Food";
  const place = item.restaurant_name || item.place_label || "";
  const note = String(item.comment || "").trim();
  const href = foodHref(item);
  const restHref = restaurantHref(item);
  const joinHref = hideJoinMe ? null : item.join_me_href;
  const caption = formatEatingCaption(item);
  const canPick = typeof onPhotoPick === "function";
  const showPhotoHint = canPick && !item.photo_url;

  function pickPhoto() {
    if (!canPick) return;
    fileRef.current?.click();
  }

  return (
    <div style={s.grid} data-testid="what-im-eating-photos">
      <article key={item.id || item.entry_id || `${label}-${safeIndex}`} style={s.photoCard}>
        {canPick ? (
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) onPhotoPick(item, file);
            }}
          />
        ) : null}
        <button
          type="button"
          data-testid="eating-photo-slot"
          onClick={pickPhoto}
          disabled={!canPick}
          onMouseEnter={() => setPhotoHover(true)}
          onMouseLeave={() => setPhotoHover(false)}
          onFocus={() => setPhotoHover(true)}
          onBlur={() => setPhotoHover(false)}
          style={{
            ...s.photoButton,
            cursor: canPick ? "pointer" : "default",
            border: 0,
            borderRadius: 0,
            boxShadow: "none",
          }}
          aria-label={canPick ? "Click to add photo of meal" : caption}
          title={showPhotoHint ? "Click to add photo of meal" : undefined}
        >
          {item.photo_url ? (
            <img src={resolveConsumerMediaUrl(item.photo_url)} alt="" style={s.photo} />
          ) : (
            <div style={{ ...s.photo, display: "grid", placeItems: "center", fontSize: 14, color: "#64748b", fontWeight: 600 }}>
              🌭
            </div>
          )}
          {showPhotoHint && photoHover ? (
            <div style={s.photoHoverHint}>Click to add photo of meal</div>
          ) : null}
          {showPhotoHint && !photoHover ? (
            <div style={s.photoHintBar}>Click to add photo of meal</div>
          ) : null}
        </button>
        <div style={s.photoLabel}>
          <div data-testid="eating-photo-caption">{caption}</div>
          {place ? (
            restHref ? (
              <Link to={restHref} style={{ ...s.photoMeta, display: "block" }}>
                {place}
              </Link>
            ) : (
              <div style={s.photoMeta}>{place}</div>
            )
          ) : null}
          {note ? <div style={s.photoMeta}>{note}</div> : null}
          {ordered.length > 1 ? (
            <div style={s.actions}>
              <button
                type="button"
                style={{ ...s.chipBtn, appearance: "none", cursor: "pointer", font: "inherit" }}
                onClick={() => setIndex((i) => (i === 0 ? ordered.length - 1 : i - 1))}
                aria-label="Previous food photo"
              >
                Prev
              </button>
              <span style={s.photoMeta}>
                {safeIndex + 1} / {ordered.length}
              </span>
              <button
                type="button"
                style={{ ...s.chipBtn, appearance: "none", cursor: "pointer", font: "inherit" }}
                onClick={() => setIndex((i) => (i + 1) % ordered.length)}
                aria-label="Next food photo"
              >
                Next
              </button>
            </div>
          ) : null}
          <div style={s.actions}>
            <Link to={href} style={s.chipBtn}>
              View dish
            </Link>
            {onSelect && item.kind === "what_i_ate" ? (
              <button
                type="button"
                style={{ ...s.chipBtn, appearance: "none", cursor: "pointer", font: "inherit" }}
                onClick={() => onSelect(item)}
              >
                Add details
              </button>
            ) : null}
            {joinHref ? (
              <Link to={joinHref} style={s.primaryBtn}>
                Join Me
              </Link>
            ) : !hideJoinMe && item.restaurant_id ? (
              <InviteToEatButton
                restaurantId={item.restaurant_id}
                restaurantName={place}
                menuItemId={item.menu_item_id}
                menuItemName={label}
                size="compact"
              />
            ) : null}
          </div>
        </div>
      </article>
    </div>
  );
}

export function NamedShareCard({
  name,
  href,
  meta,
  description,
  onInvite,
  inviteLabel = "Invite people to join",
  onRequestJoin,
  requestLabel = "Request to join",
  requestDisabled = false,
}) {
  const title = String(name || "").trim() || "Untitled";
  return (
    <div style={s.card} data-testid="named-share-card">
      {href ? (
        <Link to={href} style={{ ...s.sectionTitleLink, fontWeight: 700, fontSize: 15 }}>
          {title}
        </Link>
      ) : (
        <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>{title}</div>
      )}
      {meta ? <div style={s.muted}>{meta}</div> : null}
      {description ? <div style={{ ...s.muted, marginTop: 4 }}>{description}</div> : null}
      <div style={s.actions}>
        {onInvite ? (
          <button
            type="button"
            style={{ ...s.chipBtn, appearance: "none", cursor: "pointer", font: "inherit" }}
            onClick={onInvite}
          >
            {inviteLabel}
          </button>
        ) : null}
        {onRequestJoin ? (
          <button
            type="button"
            style={{ ...s.primaryBtn, appearance: "none", cursor: requestDisabled ? "default" : "pointer", font: "inherit" }}
            disabled={requestDisabled}
            onClick={onRequestJoin}
          >
            {requestLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function isScheduledEatingPlan(plan) {
  if (!plan) return false;
  const place = String(plan.restaurant_name || plan.place_label || "").trim();
  const title = String(plan.title || "").trim();
  return Boolean(plan.restaurant_id) || (Boolean(place) && place !== title);
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

export function FuturePlanRow({ plan, open, onToggle, onAddDetails }) {
  const label = formatFuturePlanRowLabel(plan);
  return (
    <div data-testid="future-plan-row">
      <button type="button" style={s.planSummaryBtn} onClick={onToggle}>
        {label}
      </button>
      {open ? (
        <div data-testid="future-plan-detail">
          <EatingPlanCard plan={plan} onAddDetails={onAddDetails} />
        </div>
      ) : null}
    </div>
  );
}

export function EatingPlanCard({ plan, onAddDetails }) {
  const when = formatPlanWhen(plan.plan_date);
  const { restaurant, meal, notes } = futurePlanDetailParts(plan);
  const place =
    plan.restaurant_id || (plan.place_label && plan.place_label !== plan.title) ? restaurant : "";
  const restHref = restaurantHref({
    restaurant_id: plan.restaurant_id,
    restaurant_slug: plan.restaurant_slug,
    slug: plan.restaurant_slug,
    city: plan.restaurant_city,
    state: plan.restaurant_state,
  });
  const joinHref = planJoinHref(plan);
  return (
    <div style={s.card} data-testid="eating-plan-card">
      {when ? <div style={{ fontWeight: 800 }}>{when}</div> : null}
      {meal ? <div style={s.muted}>{meal}</div> : null}
      <div style={place ? { fontWeight: 700, marginTop: 4 } : s.muted}>{place || "Add restaurant, dish, and details"}</div>
      {notes ? <div style={{ ...s.muted, marginTop: 4 }}>{notes}</div> : null}
      <div style={s.muted}>
        {plan.joinable ? `${plan.joiner_count || 0}/${plan.join_capacity || 0} joined` : "Just me"}
      </div>
      <div style={s.actions}>
        {onAddDetails ? (
          <button type="button" style={{ ...s.chipBtn, appearance: "none", cursor: "pointer", font: "inherit" }} onClick={() => onAddDetails(plan)}>
            Add details
          </button>
        ) : (
          <Link to={`/account/what-we-doing/${plan.token}`} style={s.chipBtn}>
            Plan
          </Link>
        )}
        {restHref ? (
          <Link to={restHref} style={s.chipBtn}>
            Restaurant
          </Link>
        ) : null}
        {joinHref ? (
          <Link to={joinHref} style={s.primaryBtn}>
            Join Me
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
