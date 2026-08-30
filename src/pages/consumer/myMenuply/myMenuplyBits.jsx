import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import MenuplyMediaPicker from "../../../components/social/MenuplyMediaPicker.jsx";
import InviteToEatButton from "../../../components/InviteToEatButton.jsx";
import { restaurantPathFromRow } from "../../../lib/canonicalUrl.js";
import EatingSocialActions from "./EatingSocialActions.jsx";
import { resolveConsumerMediaUrl } from "../../../lib/consumerApi.js";
import { resolveEatingDishVisual, resolveEatingPlanVisual } from "./eatingDishVisual.js";
import { useLongPressReveal } from "./mediaLongPressReveal.js";
import {
  compareMealPeriod,
  mealPeriodLabel,
  normalizeWhatIAteMealPeriod,
} from "../../../lib/whatIAteTodayMealPeriod.js";
import {
  formatEatingCaption,
  formatPlanBracketDate,
  futurePlanDetailParts,
  futurePlanRestaurantName,
  planJoinHref,
} from "./dinerHubFormat.js";
import * as s from "./myMenuplyStyles.js";
import { socialType } from "../../../lib/socialDesignTokens.js";

export function restaurantHref(row) {
  return restaurantPathFromRow(row) || (row?.restaurant_id ? `/restaurants/${row.restaurant_id}` : null);
}

export function foodHref(item) {
  if (item?.menu_item_id) {
    return `/menu-items/${encodeURIComponent(String(item.menu_item_id))}`;
  }
  if (item?.menu_item_href) return item.menu_item_href;
  if (item?.diary_href) return item.diary_href;
  if (item?.kind === "what_i_ate") return "/account/what-i-ate";
  return restaurantHref(item) || "/account/what-i-ate";
}

export function SectionHead({ title, to, testId, aside = null, kicker = null, subtitle = null }) {
  return (
    <div style={s.sectionHeadBlock} data-testid={testId}>
      {kicker ? <p style={s.sectionKicker}>{kicker}</p> : null}
      <div style={s.row}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={s.sectionTitleQuiet}>
            {to ? (
              <Link to={to} style={s.sectionTitleLink}>
                {title}
              </Link>
            ) : (
              title
            )}
          </h2>
          {subtitle ? <p style={s.sectionSubtitle}>{subtitle}</p> : null}
          <div style={s.sectionAccentRule} aria-hidden="true" />
        </div>
        {aside ? <div style={s.sectionHeadAside}>{aside}</div> : null}
      </div>
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
  const [videoBroken, setVideoBroken] = useState(false);
  const [videoMuted, setVideoMuted] = useState(true);
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
  const visual = resolveEatingDishVisual(item);
  const hasOwnMedia = Boolean(String(item.photo_url || "").trim() || String(item.video_url || "").trim());
  const hasMedia = Boolean(visual);
  const isFallbackVisual = hasMedia && !hasOwnMedia;
  const isLogoFallback = visual?.source === "logo";
  const isPlaceholder = String(item.id || "") === "placeholder" && !item.entry_id;

  useEffect(() => {
    setVideoBroken(false);
    setVideoMuted(true);
  }, [visual?.url, item?.id, item?.entry_id]);

  function pickPhoto() {
    if (!canPick || isFallbackVisual) return;
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
      onClick={canPick && hasOwnMedia ? pickPhoto : undefined}
      disabled={!canPick || isFallbackVisual}
      onMouseEnter={() => setPhotoHover(true)}
      onMouseLeave={() => setPhotoHover(false)}
      onFocus={() => setPhotoHover(true)}
      onBlur={() => setPhotoHover(false)}
      style={{
        ...(presentation ? s.heroMediaWrap : s.photoButton),
        cursor: canPick && hasOwnMedia ? "pointer" : "default",
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
      aria-label={canPick && hasOwnMedia ? "Tap to replace photo or video" : caption}
    >
      {visual.kind === "video" ? (
        <>
          <video
            src={visual.url}
            style={s.socialVideoMedia}
            controls={!presentation}
            playsInline
            muted={presentation ? videoMuted : true}
            autoPlay={Boolean(presentation) && !videoBroken}
            loop={Boolean(presentation) && !videoBroken}
            preload="auto"
            onError={() => setVideoBroken(true)}
            onClick={(e) => {
              if (presentation && !videoBroken) {
                e.stopPropagation();
                setVideoMuted((prev) => !prev);
              }
            }}
          />
          {presentation && !videoBroken ? (
            <span style={s.socialVideoMuteBadge} aria-hidden>
              {videoMuted ? "Tap for sound" : "Sound on"}
            </span>
          ) : null}
          {videoBroken ? (
            <div style={s.videoUnavailableOverlay} data-testid="eating-video-unavailable">
              Video unavailable — tap to replace
            </div>
          ) : null}
        </>
      ) : (
        <img
          src={visual.url}
          alt=""
          style={
            isLogoFallback
              ? { ...s.photo, objectFit: "contain", background: "#fff", padding: 24 }
              : s.photo
          }
        />
      )}
      {presentation ? (
        <>
          <div style={s.heroOverlayTop}>
            {mealBadge ? <span style={s.heroBadge}>{mealBadge}</span> : <span />}
            {canPick && hasOwnMedia && photoHover ? (
              <span style={s.heroBadge}>Replace</span>
            ) : null}
          </div>
          <div style={s.heroOverlayBottom}>
            <div style={s.heroTitle}>{label}</div>
            {place ? <div style={s.heroMeta}>{place}</div> : null}
            {note ? <div style={s.heroCaption}>{note}</div> : null}
          </div>
        </>
      ) : canPick && hasOwnMedia && photoHover ? (
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

function crewMemberInitials(crew) {
  const preview = crew?.members_preview || crew?.members || [];
  if (preview.length) {
    return preview.slice(0, 4).map((member) => {
      const name = member.display_name || member.name || "?";
      return String(name).trim().slice(0, 1).toUpperCase() || "?";
    });
  }
  const count = Math.max(1, Math.min(Number(crew?.member_count) || 1, 4));
  const seed = String(crew?.name || "C").trim().slice(0, 1).toUpperCase() || "C";
  if (count === 1) return [seed];
  const initials = [seed];
  for (let i = 1; i < count; i += 1) {
    initials.push(i === count - 1 && count > 3 ? `+${count - 3}` : String.fromCharCode(65 + i));
  }
  return initials.slice(0, 4);
}

function CrewMemberStack({ crew }) {
  const initials = crewMemberInitials(crew);
  if (!initials.length) return null;
  return (
    <div style={s.crewMemberStack} data-testid="crew-member-stack" aria-hidden="true">
      {initials.map((label, index) => (
        <span
          key={`${label}-${index}`}
          style={{
            ...s.crewMemberInit,
            ...(index === 0 ? s.crewMemberInitFirst : null),
          }}
        >
          {label}
        </span>
      ))}
    </div>
  );
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
  onDelete,
  deleteBusy = false,
}) {
  const navigate = useNavigate();
  const title = String(crew?.name || "").trim() || "Untitled";
  const purpose = crewPurposeText(crew);
  const canDelete = typeof onDelete === "function";
  const { open, dismiss, consumeArmedClick, bind } = useLongPressReveal(canDelete);

  function handleDelete(e) {
    e.preventDefault();
    e.stopPropagation();
    if (deleteBusy) return;
    dismiss();
    onDelete?.(crew);
  }

  function handleCardActivate(e) {
    if (consumeArmedClick() || open) {
      e.preventDefault();
      e.stopPropagation();
      if (open && !e.target?.closest?.('[data-testid="hub-card-delete"]')) dismiss();
      return;
    }
    if (e.target?.closest?.("button, a")) return;
    if (href) navigate(href);
  }

  return (
    <div
      style={{
        ...s.card,
        ...s.hubCardShell,
        ...(href ? { cursor: "pointer", WebkitTapHighlightColor: "transparent" } : null),
      }}
      data-testid="dining-crew-hub-card"
      role={href ? "link" : undefined}
      tabIndex={href ? 0 : undefined}
      onKeyDown={
        href
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                navigate(href);
              }
            }
          : undefined
      }
      {...bind}
      onClick={handleCardActivate}
    >
      {open ? (
        <button
          type="button"
          style={s.hubCardDelete}
          data-testid="hub-card-delete"
          aria-label={`Delete ${title}`}
          disabled={deleteBusy}
          onClick={handleDelete}
        >
          Delete
        </button>
      ) : null}
      <div style={href ? s.cardTitleLink : { fontWeight: 700, fontSize: 15, color: "#0f172a" }}>
        {title}
      </div>
      {purpose ? (
        <div style={s.crewPurpose} data-testid="crew-purpose">
          <span style={s.crewPurposeLabel}>Purpose</span>
          <span>{purpose}</span>
        </div>
      ) : null}
      {meta ? <div style={{ ...s.muted, marginTop: purpose ? 6 : 4 }}>{meta}</div> : null}
      <CrewMemberStack crew={crew} />
      <div style={s.actions}>
        {onInvite ? (
          <button
            type="button"
            style={{ ...s.chipBtn, appearance: "none", cursor: "pointer", font: "inherit" }}
            onClick={(e) => {
              e.stopPropagation();
              onInvite(e);
            }}
          >
            {inviteLabel}
          </button>
        ) : null}
        {onRequestJoin ? (
          <button
            type="button"
            style={{
              ...s.primaryBtn,
              appearance: "none",
              cursor: requestDisabled ? "default" : "pointer",
              font: "inherit",
            }}
            disabled={requestDisabled}
            onClick={(e) => {
              e.stopPropagation();
              onRequestJoin(e);
            }}
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
  onDelete,
  deleteBusy = false,
  deleteLabel,
}) {
  const navigate = useNavigate();
  const title = String(name || "").trim() || "Untitled";
  const canDelete = typeof onDelete === "function";
  const { open, dismiss, consumeArmedClick, bind } = useLongPressReveal(canDelete);

  function handleDelete(e) {
    e.preventDefault();
    e.stopPropagation();
    if (deleteBusy) return;
    dismiss();
    onDelete?.();
  }

  function handleCardActivate(e) {
    if (consumeArmedClick() || open) {
      e.preventDefault();
      e.stopPropagation();
      if (open && !e.target?.closest?.('[data-testid="hub-card-delete"]')) dismiss();
      return;
    }
    if (e.target?.closest?.("button, a")) return;
    if (href) navigate(href);
  }

  return (
    <div
      style={{
        ...s.card,
        ...s.hubCardShell,
        ...(href ? { cursor: "pointer", WebkitTapHighlightColor: "transparent" } : null),
      }}
      data-testid="named-share-card"
      role={href ? "link" : undefined}
      tabIndex={href ? 0 : undefined}
      onKeyDown={
        href
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                navigate(href);
              }
            }
          : undefined
      }
      {...bind}
      onClick={handleCardActivate}
    >
      {open ? (
        <button
          type="button"
          style={s.hubCardDelete}
          data-testid="hub-card-delete"
          aria-label={deleteLabel || `Delete ${title}`}
          disabled={deleteBusy}
          onClick={handleDelete}
        >
          Delete
        </button>
      ) : null}
      <div style={href ? s.cardTitleLink : { fontWeight: 700, fontSize: 15, color: "#0f172a" }}>
        {title}
      </div>
      {meta ? <div style={s.muted}>{meta}</div> : null}
      {description ? <div style={{ ...s.muted, marginTop: 4 }}>{description}</div> : null}
      <div style={s.actions}>
        {onInvite ? (
          <button
            type="button"
            style={{ ...s.chipBtn, appearance: "none", cursor: "pointer", font: "inherit" }}
            onClick={(e) => {
              e.stopPropagation();
              onInvite(e);
            }}
          >
            {inviteLabel}
          </button>
        ) : null}
        {onRequestJoin ? (
          <button
            type="button"
            style={{
              ...s.primaryBtn,
              appearance: "none",
              cursor: requestDisabled ? "default" : "pointer",
              font: "inherit",
            }}
            disabled={requestDisabled}
            onClick={(e) => {
              e.stopPropagation();
              onRequestJoin(e);
            }}
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

export function EatingPlanRestaurantMark({ plan, name, size = "row" }) {
  const visual = resolveEatingPlanVisual(plan);
  if (!visual) return null;

  if (visual.source === "logo") {
    return (
      <div
        style={size === "detail" ? s.planCardMarkDetail : s.planCardMark}
        data-testid="eating-plan-logo"
        aria-hidden
      >
        <img src={visual.url} alt="" style={s.planCardMarkLogo} />
      </div>
    );
  }

  if (visual.source === "billboard") {
    return (
      <div
        style={size === "detail" ? s.planCardMarkDetail : s.planCardMark}
        data-testid="eating-plan-billboard"
        aria-hidden
      >
        <img src={visual.url} alt="" style={s.planCardMarkBillboard} />
        <div style={s.planCardMarkBillboardScrim}>
          <span style={s.planCardMarkBillboardName}>{name}</span>
        </div>
      </div>
    );
  }

  return null;
}

export function FuturePlanRow({
  plan,
  open,
  onToggle,
  onOpenCalendar,
  onAddDetails,
  onAddPlanVideo,
  onDelete,
  deleteBusy = false,
}) {
  const when = formatPlanBracketDate(plan?.plan_date);
  const name = futurePlanRestaurantName(plan);
  const { meal, notes } = futurePlanDetailParts(plan);
  const joinHref = planJoinHref(plan);
  const canDelete = typeof onDelete === "function";
  const {
    open: deleteOpen,
    dismiss,
    consumeArmedClick,
    bind,
  } = useLongPressReveal(canDelete);

  function handleDelete(e) {
    e.preventDefault();
    e.stopPropagation();
    if (deleteBusy) return;
    dismiss();
    onDelete?.(plan);
  }

  return (
    <div style={s.hubCardShell} data-testid="future-plan-row" {...bind}>
      {deleteOpen ? (
        <button
          type="button"
          style={s.hubCardDelete}
          data-testid="hub-card-delete"
          aria-label={`Delete eating plan ${name}`}
          disabled={deleteBusy}
          onClick={handleDelete}
        >
          Delete
        </button>
      ) : null}
      <button
        type="button"
        style={{
          ...s.planRowCompact,
          ...(open ? s.planRowCompactOpen : null),
        }}
        onClick={() => {
          if (consumeArmedClick() || deleteOpen) {
            dismiss();
            return;
          }
          if (onOpenCalendar) onOpenCalendar(plan);
          else onToggle?.();
        }}
        aria-expanded={open}
      >
        <div style={s.planRowCopy}>
          {when ? <div style={s.planCardDate}>{when}</div> : null}
          <div style={s.planCardTitle}>{name}</div>
          <div style={s.planCardMeta}>
            {[meal, plan.joinable ? "Join Me open" : "Just me", notes].filter(Boolean).join(" · ")}
          </div>
        </div>
        {joinHref ? (
          <Link
            to={joinHref}
            style={s.planRowJoinBtn}
            data-testid="plan-row-join-me"
            onClick={(e) => e.stopPropagation()}
          >
            Join Me
          </Link>
        ) : null}
      </button>
      {open ? (
        <div data-testid="future-plan-detail">
          <EatingPlanCard
            plan={plan}
            onAddDetails={onAddDetails}
            onAddPlanVideo={onAddPlanVideo}
          />
        </div>
      ) : null}
    </div>
  );
}

export function EatingPlanCard({ plan, onAddDetails, onAddPlanVideo }) {
  const when = formatPlanWhen(plan.plan_date);
  const { restaurant, meal, notes } = futurePlanDetailParts(plan);
  const visual = resolveEatingPlanVisual(plan);
  const showNameText = !visual;
  const hasPlanVideo = Boolean(String(plan.video_url || "").trim());
  const showAddPlanVideo =
    typeof onAddPlanVideo === "function" && plan.is_creator !== false && !hasPlanVideo;
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
      {place ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
          <EatingPlanRestaurantMark plan={plan} name={restaurant} size="detail" />
          {showNameText ? <div style={{ fontWeight: 700 }}>{restaurant}</div> : null}
        </div>
      ) : (
        <div style={s.muted}>Add restaurant, dish, and details</div>
      )}
      {notes ? <div style={{ ...s.muted, marginTop: 4 }}>{notes}</div> : null}
      <div style={s.muted}>
        {plan.joinable ? `${plan.joiner_count || 0}/${plan.join_capacity || 0} joined` : "Just me"}
      </div>
      <div style={s.actions}>
        {showAddPlanVideo ? (
          <button
            type="button"
            style={{ ...s.chipBtn, appearance: "none", cursor: "pointer", font: "inherit" }}
            data-testid="plan-add-video"
            onClick={() => onAddPlanVideo(plan)}
          >
            Add plan video
          </button>
        ) : null}
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
function WantToEatCard({
  want,
  readOnly,
  isScroll,
  onSelectItem,
  onDelete,
  deleteBusy,
}) {
  const href = want.menu_item_id
    ? `/menu-items/${encodeURIComponent(String(want.menu_item_id))}`
    : null;
  const visual = resolveEatingDishVisual(want);
  const hasDishMedia = visual?.source === "dish";
  const showLogo = visual?.source === "logo";
  const showBillboard = visual?.source === "billboard";
  const showHeroVisual = hasDishMedia || showBillboard;
  const place = String(want.restaurant_name || "").trim();
  const foodName = String(want.food_name || "").trim() || "Want";
  const canDelete = !readOnly && typeof onDelete === "function" && want?.id != null;
  const { open, dismiss, consumeArmedClick, bind } = useLongPressReveal(canDelete);

  const cardStyle = isScroll
    ? showHeroVisual
      ? wantStyles.scrollCardPhoto
      : wantStyles.scrollCard
    : wantStyles.card;
  const shellStyle = isScroll
    ? {
        position: "relative",
        flex: cardStyle.flex,
        width: cardStyle.width || undefined,
        scrollSnapAlign: "start",
        flexShrink: 0,
      }
    : { position: "relative", width: "100%" };

  let mediaBlock;
  if (showHeroVisual) {
    mediaBlock = (
      <div
        style={isScroll ? wantStyles.scrollPhotoWrap : wantStyles.stackPhotoWrap}
        data-testid={
          showBillboard ? "want-to-eat-billboard-media" : "want-to-eat-dish-media"
        }
      >
        {visual.kind === "video" ? (
          <video
            src={visual.url}
            style={isScroll ? wantStyles.scrollPhoto : wantStyles.stackPhoto}
            playsInline
            muted
            autoPlay
            loop
            preload="auto"
          />
        ) : (
          <img
            src={visual.url}
            alt=""
            style={isScroll ? wantStyles.scrollPhoto : wantStyles.stackPhoto}
          />
        )}
        {isScroll ? (
          <div style={wantStyles.scrollPhotoScrim}>
            <div style={wantStyles.scrollPhotoTitle}>{foodName}</div>
            {place ? <div style={wantStyles.scrollPhotoMeta}>{place}</div> : null}
          </div>
        ) : null}
      </div>
    );
  } else if (showLogo) {
    mediaBlock = (
      <div
        style={isScroll ? wantStyles.scrollThumbPlaceholder : wantStyles.thumbPlaceholder}
        data-testid="want-to-eat-logo"
      >
        <img src={visual.url} alt="" style={wantStyles.logoThumb} />
      </div>
    );
  } else {
    mediaBlock = (
      <div
        style={isScroll ? wantStyles.scrollThumbPlaceholder : wantStyles.thumbPlaceholder}
        aria-hidden
        data-testid="want-to-eat-placeholder"
      >
        🍽
      </div>
    );
  }

  const showTextBelow = !(isScroll && showHeroVisual);
  const copyBlock = showTextBelow ? (
    <div style={wantStyles.copy}>
      <div style={wantStyles.title}>{foodName}</div>
      {place ? <div style={socialType.meta}>{place}</div> : null}
      {readOnly || isScroll ? null : want.menu_item_id ? (
        <div style={wantStyles.hint}>Menu item linked</div>
      ) : (
        <div style={wantStyles.hint}>Tap to link restaurant and menu item</div>
      )}
    </div>
  ) : null;

  const body = (
    <div
      style={
        isScroll
          ? wantStyles.scrollRow
          : showHeroVisual
            ? wantStyles.stackPhotoRow
            : wantStyles.row
      }
    >
      {mediaBlock}
      {copyBlock}
    </div>
  );

  let main;
  if (href) {
    main = (
      <Link
        to={href}
        style={cardStyle}
        data-testid="want-to-eat-item-link"
        onClick={(e) => {
          if (consumeArmedClick() || open) {
            e.preventDefault();
            dismiss();
          }
        }}
      >
        {body}
      </Link>
    );
  } else if (readOnly) {
    main = (
      <div style={cardStyle} data-testid="want-to-eat-item-body">
        {body}
      </div>
    );
  } else {
    main = (
      <button
        type="button"
        style={cardStyle}
        data-testid="want-to-eat-item-body"
        onClick={() => {
          if (consumeArmedClick()) return;
          if (open) {
            dismiss();
            return;
          }
          onSelectItem?.(want);
        }}
      >
        {body}
      </button>
    );
  }

  return (
    <div style={shellStyle} data-testid="want-to-eat-item" {...bind}>
      {main}
      {open ? (
        <button
          type="button"
          style={s.mealHolderDelete}
          data-testid="want-to-eat-delete"
          aria-label={`Delete ${foodName}`}
          disabled={deleteBusy}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (deleteBusy) return;
            dismiss();
            onDelete?.(want);
          }}
        >
          Delete
        </button>
      ) : null}
    </div>
  );
}

export function WantToEatList({
  items = [],
  readOnly = false,
  onSelectItem,
  onDelete,
  deleteBusy = false,
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

  const isScroll = layout === "scroll";
  const listStyle = isScroll ? wantStyles.scrollList : wantStyles.list;

  return (
    <div style={listStyle} data-testid="want-to-eat-list">
      {rows.map((want) => (
        <WantToEatCard
          key={want.id}
          want={want}
          readOnly={readOnly}
          isScroll={isScroll}
          onSelectItem={onSelectItem}
          onDelete={onDelete}
          deleteBusy={deleteBusy}
        />
      ))}
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
    margin: "0 -16px",
    paddingLeft: 16,
    paddingRight: 16,
    scrollSnapType: "x mandatory",
    WebkitOverflowScrolling: "touch",
    scrollbarWidth: "none",
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
    flex: "0 0 148px",
    width: 148,
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
  scrollCardPhoto: {
    display: "block",
    flex: "0 0 220px",
    width: 220,
    scrollSnapAlign: "start",
    textAlign: "left",
    textDecoration: "none",
    color: "inherit",
    borderRadius: 16,
    border: "1px solid #e5e7eb",
    background: "#0f172a",
    padding: 0,
    overflow: "hidden",
    cursor: "pointer",
    font: "inherit",
    boxShadow: "0 10px 28px rgba(15, 23, 42, 0.14)",
  },
  row: { display: "flex", gap: 0, alignItems: "stretch" },
  stackPhotoRow: { display: "flex", flexDirection: "column", alignItems: "stretch" },
  scrollRow: { display: "flex", flexDirection: "column", alignItems: "stretch" },
  thumb: {
    width: 112,
    minHeight: 112,
    objectFit: "cover",
    flexShrink: 0,
    display: "block",
    background: "#f1f5f9",
  },
  stackPhotoWrap: {
    position: "relative",
    width: "100%",
    minHeight: 180,
    background: "#0f172a",
  },
  stackPhoto: {
    width: "100%",
    height: 180,
    objectFit: "cover",
    display: "block",
  },
  scrollPhotoWrap: {
    position: "relative",
    width: "100%",
    height: 200,
    background: "#0f172a",
  },
  scrollPhoto: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  scrollPhotoScrim: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: "28px 10px 10px",
    background: "linear-gradient(180deg, transparent 0%, rgba(15,23,42,0.82) 100%)",
    color: "#fff",
  },
  scrollPhotoTitle: {
    fontSize: 14,
    fontWeight: 800,
    lineHeight: 1.25,
    letterSpacing: "-0.01em",
  },
  scrollPhotoMeta: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: 600,
    opacity: 0.9,
  },
  logoThumb: {
    width: "72%",
    height: "72%",
    maxWidth: 88,
    maxHeight: 88,
    objectFit: "contain",
    display: "block",
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
