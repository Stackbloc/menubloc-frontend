import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import MenuplyMediaPicker from "../../../components/social/MenuplyMediaPicker.jsx";
import InviteToEatButton from "../../../components/InviteToEatButton.jsx";
import { restaurantPathFromRow } from "../../../lib/canonicalUrl.js";
import EatingSocialActions from "./EatingSocialActions.jsx";
import { resolveConsumerMediaUrl } from "../../../lib/consumerApi.js";
import {
  compareMealPeriod,
  mealPeriodLabel,
  normalizeWhatIAteMealPeriod,
} from "../../../lib/whatIAteTodayMealPeriod.js";
import {
  formatEatingCaption,
  formatFuturePlanRowLabel,
  futurePlanDetailParts,
  planJoinHref,
} from "./dinerHubFormat.js";
import * as s from "./myMenuplyStyles.js";
import { socialType } from "../../../lib/socialDesignTokens.js";

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

export function PhotoGrid({ items, onSelect, onPhotoPick, hideJoinMe = false, presentation = false }) {
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
  const [replaceMediaOpen, setReplaceMediaOpen] = useState(false);
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
  const hasMedia = Boolean(item.photo_url || item.video_url);
  const isPlaceholder = String(item.id || "") === "placeholder" && !item.entry_id;

  function pickPhoto() {
    if (!canPick) return;
    setReplaceMediaOpen(true);
  }

  function handlePhotoFile(file) {
    if (file) onPhotoPick(item, file);
    setReplaceMediaOpen(false);
  }

  if (isPlaceholder) return null;

  const mealBadge = item.meal_period
    ? mealPeriodLabel(normalizeWhatIAteMealPeriod(item.meal_period))
    : null;

  const mediaBlock = hasMedia ? (
    <button
      type="button"
      data-testid="eating-photo-slot"
      onClick={canPick ? pickPhoto : undefined}
      disabled={!canPick}
      onMouseEnter={() => setPhotoHover(true)}
      onMouseLeave={() => setPhotoHover(false)}
      onFocus={() => setPhotoHover(true)}
      onBlur={() => setPhotoHover(false)}
      style={{
        ...(presentation ? s.heroMediaWrap : s.photoButton),
        cursor: canPick ? "pointer" : "default",
        border: 0,
        borderRadius: 0,
        boxShadow: "none",
        padding: 0,
        width: "100%",
        appearance: "none",
        font: "inherit",
        textAlign: "left",
        position: "relative",
        overflow: "hidden",
      }}
      aria-label={canPick ? "Tap to replace photo or video" : caption}
    >
      {item.video_url ? (
        <video
          src={resolveConsumerMediaUrl(item.video_url)}
          style={s.photo}
          controls={!presentation}
          playsInline
          preload="metadata"
        />
      ) : (
        <img src={resolveConsumerMediaUrl(item.photo_url)} alt="" style={s.photo} />
      )}
      {presentation ? (
        <>
          <div style={s.heroOverlayTop}>
            {mealBadge ? <span style={s.heroBadge}>{mealBadge}</span> : <span />}
            {canPick && photoHover ? (
              <span style={s.heroBadge}>Replace</span>
            ) : null}
          </div>
          <div style={s.heroOverlayBottom}>
            <div style={s.heroTitle}>{label}</div>
            {place ? <div style={s.heroMeta}>{place}</div> : null}
            {note ? <div style={s.heroCaption}>{note}</div> : null}
          </div>
        </>
      ) : canPick && photoHover ? (
        <div style={s.photoHoverHint}>Tap to replace photo or video</div>
      ) : null}
    </button>
  ) : null;

  const cardShell = hasMedia && presentation ? s.heroCard : hasMedia ? s.photoCard : s.eatingRowCompact;

  return (
    <div style={s.grid} data-testid="what-im-eating-photos">
      {replaceMediaOpen ? (
        <MenuplyMediaPicker
          onFile={handlePhotoFile}
          disabled={!canPick}
          facingMode="environment"
          allowPhoto
          allowVideo
          showPreview={false}
          openOnMount
          testId="eating-photo-picker"
          ariaLabel="Add or replace eating photo or video"
        />
      ) : null}
      <article key={item.id || item.entry_id || `${label}-${safeIndex}`} style={cardShell}>
        {mediaBlock}
        {!presentation || !hasMedia ? (
          <div style={hasMedia ? s.photoLabel : undefined}>
            {!hasMedia ? (
              <div data-testid="eating-photo-caption" style={socialType.meta}>
                {caption}
              </div>
            ) : null}
            {!hasMedia && item.meal_period ? (
              <div style={socialType.meta}>
                {mealPeriodLabel(normalizeWhatIAteMealPeriod(item.meal_period))}
              </div>
            ) : null}
            {!hasMedia && place ? (
              restHref ? (
                <Link to={restHref} style={{ ...s.photoMeta, display: "block" }}>
                  {place}
                </Link>
              ) : (
                <div style={s.photoMeta}>{place}</div>
              )
            ) : null}
            {!hasMedia && note ? <div style={socialType.caption}>{note}</div> : null}
            {canPick && !hasMedia ? (
              <div style={{ marginTop: 10 }}>
                <MenuplyMediaPicker
                  onFile={handlePhotoFile}
                  disabled={!canPick}
                  facingMode="environment"
                  allowPhoto
                  allowVideo
                  showPreview={false}
                  testId="eating-photo-slot"
                  ariaLabel="Add photo or video"
                  iconStyle={{ width: 36, height: 36, borderRadius: 999 }}
                />
              </div>
            ) : null}
            {!presentation ? (
              <>
                <EatingSocialActions item={item} />
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
                  ) : null}
                </div>
              </>
            ) : null}
          </div>
        ) : null}
        {presentation && hasMedia ? (
          <div style={s.heroBody}>
            <EatingSocialActions item={item} />
            <div style={s.heroActions}>
              <Link to={href} style={s.textLink}>
                View dish
              </Link>
              {onSelect && item.kind === "what_i_ate" ? (
                <button type="button" style={s.textLinkBtn} onClick={() => onSelect(item)}>
                  Add details
                </button>
              ) : null}
              {joinHref ? (
                <Link to={joinHref} style={s.textLinkAccent}>
                  Join Me
                </Link>
              ) : null}
            </div>
            {ordered.length > 1 ? (
              <div style={s.heroDotNav} aria-label="More meals">
                {ordered.map((_, dotIndex) => (
                  <button
                    key={dotIndex}
                    type="button"
                    aria-label={`Meal ${dotIndex + 1}`}
                    style={{
                      ...s.heroDot,
                      ...(dotIndex === safeIndex ? s.heroDotActive : null),
                    }}
                    onClick={() => setIndex(dotIndex)}
                  />
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </article>
    </div>
  );
}

export function crewPurposeText(crew) {
  return String(crew?.description || crew?.purpose || "").trim() || null;
}

export function DiningCrewHubCard({
  crew,
  href,
  meta,
  onInvite,
  inviteLabel = "Invite people to join",
  onRequestJoin,
  requestLabel = "Request to join",
  requestDisabled = false,
}) {
  const title = String(crew?.name || "").trim() || "Untitled";
  const purpose = crewPurposeText(crew);
  return (
    <div style={s.card} data-testid="dining-crew-hub-card">
      {href ? (
        <Link to={href} style={s.cardTitleLink}>
          {title}
        </Link>
      ) : (
        <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>{title}</div>
      )}
      {purpose ? (
        <div style={s.crewPurpose} data-testid="crew-purpose">
          <span style={s.crewPurposeLabel}>Purpose</span>
          <span>{purpose}</span>
        </div>
      ) : null}
      {meta ? <div style={{ ...s.muted, marginTop: purpose ? 6 : 4 }}>{meta}</div> : null}
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
        <Link to={href} style={s.cardTitleLink}>
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
  return Boolean(plan.restaurant_id) || (Boolean(place) && place !== title) || /^Homemade/i.test(place);
}

export function ConnectionFoodCard({ item }) {
  const name = item.peer?.display_name || "A diner";
  const restaurantName = item.restaurant_name;
  const joinHref = item.join_me_href;
  const restHref = restaurantHref(item);
  const href = foodHref(item);
  return (
    <div style={s.card} data-testid="connections-eating-card">
      <strong style={{ display: "block", fontSize: 14 }}>{name}</strong>
      {item.photo_url ? (
        <img
          src={resolveConsumerMediaUrl(item.photo_url)}
          alt=""
          style={{ width: "100%", height: 168, objectFit: "cover", borderRadius: 10, marginTop: 10 }}
        />
      ) : null}
      <Link to={href} style={{ ...s.link, display: "block", marginTop: 8, fontSize: 15, fontWeight: 800 }}>
        {item.food_name}
      </Link>
      {restaurantName ? (
        restHref ? (
          <Link to={restHref} style={{ ...s.muted, display: "block", marginTop: 4 }}>
            {restaurantName}
          </Link>
        ) : (
          <div style={{ ...s.muted, marginTop: 4 }}>{restaurantName}</div>
        )
      ) : null}
      <EatingSocialActions item={item} testId="connections-eating-social-actions" />
      <div style={s.actions}>
        {item.menu_item_id || item.menu_item_href ? (
          <Link to={href} style={s.chipBtn}>
            View Menu Item
          </Link>
        ) : (
          <Link to={href} style={s.chipBtn}>
            View food
          </Link>
        )}
        {joinHref ? (
          <Link to={joinHref} style={s.primaryBtn}>
            Join Me
          </Link>
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

/** Shared want-list cards for My Menuply and Connection peer hubs. */
export function WantToEatList({
  items = [],
  readOnly = false,
  onSelectItem,
  emptyMessage = null,
  limit = 12,
  layout = "stack",
}) {
  const rows = (items || []).slice(0, limit);
  if (!rows.length) {
    return emptyMessage ? (
      <p style={s.muted} data-testid="want-to-eat-empty">
        {emptyMessage}
      </p>
    ) : null;
  }

  const listStyle = layout === "scroll" ? wantStyles.scrollList : wantStyles.list;

  return (
    <div style={listStyle} data-testid="want-to-eat-list">
      {rows.map((want) => {
        const href = want.menu_item_id ? `/menu-items/${want.menu_item_id}` : null;
        const mediaUrl = want.photo_url || want.video_url;
        const cardStyle = layout === "scroll" ? wantStyles.scrollCard : wantStyles.card;
        const body = (
          <div style={layout === "scroll" ? wantStyles.scrollRow : wantStyles.row}>
            {mediaUrl ? (
              want.video_url ? (
                <video
                  src={resolveConsumerMediaUrl(want.video_url)}
                  style={layout === "scroll" ? wantStyles.scrollThumb : wantStyles.thumb}
                  controls
                  playsInline
                  preload="metadata"
                />
              ) : (
                <img
                  src={resolveConsumerMediaUrl(want.photo_url)}
                  alt=""
                  style={layout === "scroll" ? wantStyles.scrollThumb : wantStyles.thumb}
                />
              )
            ) : (
              <div
                style={layout === "scroll" ? wantStyles.scrollThumbPlaceholder : wantStyles.thumbPlaceholder}
                aria-hidden
              >
                🍽
              </div>
            )}
            <div style={wantStyles.copy}>
              <div style={wantStyles.title}>{want.food_name}</div>
              {want.restaurant_name ? <div style={socialType.meta}>{want.restaurant_name}</div> : null}
              {readOnly || layout === "scroll" ? null : want.menu_item_id ? (
                <div style={wantStyles.hint}>Menu item linked</div>
              ) : (
                <div style={wantStyles.hint}>Tap to link restaurant and menu item</div>
              )}
            </div>
          </div>
        );

        if (href) {
          return (
            <Link key={want.id} to={href} style={cardStyle} data-testid="want-to-eat-item">
              {body}
            </Link>
          );
        }

        if (readOnly) {
          return (
            <div key={want.id} style={cardStyle} data-testid="want-to-eat-item">
              {body}
            </div>
          );
        }

        return (
          <button
            key={want.id}
            type="button"
            style={cardStyle}
            data-testid="want-to-eat-item"
            onClick={() => onSelectItem?.(want)}
          >
            {body}
          </button>
        );
      })}
    </div>
  );
}

const wantStyles = {
  list: { display: "grid", gap: 10 },
  scrollList: {
    display: "flex",
    gap: 12,
    overflowX: "auto",
    paddingBottom: 4,
    margin: "0 -4px",
    scrollSnapType: "x mandatory",
    WebkitOverflowScrolling: "touch",
  },
  card: {
    display: "block",
    width: "100%",
    textAlign: "left",
    textDecoration: "none",
    color: "inherit",
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    background: "#fff",
    padding: 0,
    overflow: "hidden",
    cursor: "pointer",
    font: "inherit",
    boxShadow: "0 4px 16px rgba(15, 23, 42, 0.06)",
  },
  scrollCard: {
    display: "block",
    flex: "0 0 168px",
    width: 168,
    scrollSnapAlign: "start",
    textAlign: "left",
    textDecoration: "none",
    color: "inherit",
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    background: "#fff",
    padding: 0,
    overflow: "hidden",
    cursor: "pointer",
    font: "inherit",
    boxShadow: "0 6px 18px rgba(15, 23, 42, 0.08)",
  },
  row: { display: "flex", gap: 0, alignItems: "stretch" },
  scrollRow: { display: "flex", flexDirection: "column", alignItems: "stretch" },
  thumb: {
    width: 112,
    minHeight: 112,
    objectFit: "cover",
    flexShrink: 0,
    display: "block",
    background: "#f1f5f9",
  },
  scrollThumb: {
    width: "100%",
    height: 120,
    objectFit: "cover",
    display: "block",
    background: "#f1f5f9",
  },
  thumbPlaceholder: {
    width: 112,
    minHeight: 112,
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f8fafc",
    fontSize: 28,
  },
  scrollThumbPlaceholder: {
    width: "100%",
    height: 120,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f8fafc",
    fontSize: 28,
  },
  copy: { padding: "12px 14px", flex: 1, minWidth: 0 },
  title: { fontWeight: 800, fontSize: 15, color: "#0f172a", marginBottom: 4, lineHeight: 1.25 },
  hint: { fontSize: 12, color: "#64748b", marginTop: 6 },
};
