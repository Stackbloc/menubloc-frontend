/**
 * My Menuply food sections — presentation only.
 * Creation opens via bottom-nav X → EatingComposeSheet / plan sheet.
 * Owner + peer share this module (peer: readOnly).
 */

import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DinerCalendarSheet, { DinerCalendarTrigger } from "./DinerCalendarSheet.jsx";
import EatingComposeSheet from "./EatingComposeSheet.jsx";
import EatingPlanDayForm from "./EatingPlanDayForm.jsx";
import PostAfterActions from "./PostAfterActions.jsx";
import ActivityStatusLineCompose from "./ActivityStatusLineCompose.jsx";
import DinerActivityScanRow from "./DinerActivityScanRow.jsx";
import DinerSocialPresetsPanel from "./DinerSocialPresetsPanel.jsx";
import SectionEmptyState from "./SectionEmptyState.jsx";
import SectionHeader, { PROFILE_SECTION_HEADERS } from "./SectionHeader.jsx";
import { groupHubAteMeals } from "../../../lib/groupHubAteMeals.js";
import {
  FuturePlanRow,
  WantToEatUnifiedList,
} from "./myMenuplyBits.jsx";
import {
  calendarDayYmd,
  clampEatingLookbackDate,
  compareYmd,
  eatingHistoryStart,
  planYmd,
  shiftYmd,
} from "./eatingHubUtils.js";
import {
  formatEatingHubDateHeading,
  formatPlanBracketDate,
  futurePlanKey,
  isoToTimeInputValue,
  splitMealFoodLead,
  timeInputToIso,
} from "./dinerHubFormat.js";
import { whatIAteTodayLocalDate } from "../../../lib/consumerApi.js";
import { defaultWhatIAteMealPeriod } from "../../../lib/whatIAteTodayMealPeriod.js";
import WantDiscoveryPanel from "./WantDiscoveryPanel.jsx";
import NearbyEatingSection from "./NearbyEatingSection.jsx";
import * as s from "./myMenuplyStyles.js";
import { GREEN_MID } from "./myMenuplyStyles.js";

function formatInlineDayLabel(hubDate, today) {
  if (hubDate === today) return "Today";
  return formatPlanBracketDate(hubDate);
}

/** Guest Join Me destinations only — never the I'm Eating At composer. */
function isJoinMeGuestHref(href) {
  const path = String(href || "").trim();
  if (!path || path.startsWith("/account/im-eating")) return false;
  return path.startsWith("/join-me/") || path.startsWith("/account/what-we-doing/");
}

/**
 * Own-hub Connect View: schedule Join Me or Take Me Out from a craving.
 * Edit View uses Take Me Out On/Off presets instead.
 * Peer-hub: Invite Me Out when eligible.
 */
function WantCravingsActionBox({
  wants = [],
  diningIntents = [],
  canEdit = false,
  /** Own-hub Connect preview — show owner Join Me / Take Me Out. */
  isConnectPreview = false,
  canInviteMeOut = false,
  onJoinMeFromCraving,
  onTakeMeOutFromCraving,
  onInviteMeOut,
}) {
  const [open, setOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState("");
  const [mode, setMode] = useState("join_me");
  const [error, setError] = useState("");

  const options = useMemo(() => {
    const rows = [];
    for (const intent of diningIntents || []) {
      const place = String(intent.restaurant_name || "").trim() || "Restaurant";
      rows.push({
        key: `di-${intent.id}`,
        kind: "dining_intent",
        label: place,
        intent,
        restaurantId: intent.restaurant_id ?? null,
      });
    }
    for (const want of wants || []) {
      const food = String(want.food_name || "").trim() || "Dish";
      const place = String(want.restaurant_name || "").trim();
      rows.push({
        key: `w-${want.id}`,
        kind: "want",
        label: place ? `${food} · ${place}` : food,
        want,
        restaurantId: want.restaurant_id ?? null,
      });
    }
    return rows;
  }, [wants, diningIntents]);

  if (!options.length) return null;

  /** Connect View only — Edit View uses Take Me Out On/Off presets instead. */
  const showOwnerFlow =
    isConnectPreview && typeof onJoinMeFromCraving === "function";
  const showPeerInvite =
    !canEdit && !isConnectPreview && canInviteMeOut && typeof onInviteMeOut === "function";
  if (!showOwnerFlow && !showPeerInvite) return null;

  const selected = options.find((o) => o.key === selectedKey) || options[0];

  function handleContinue() {
    setError("");
    if (!selected) return;
    if (mode === "take_me_out") {
      if (selected.restaurantId == null || String(selected.restaurantId).trim() === "") {
        setError("Pick a craving with a restaurant for Take Me Out.");
        return;
      }
      if (typeof onTakeMeOutFromCraving !== "function") {
        setError("Take Me Out is unavailable right now.");
        return;
      }
      onTakeMeOutFromCraving(selected);
      setOpen(false);
      return;
    }
    onJoinMeFromCraving(selected);
    setOpen(false);
  }

  return (
    <div style={wantActStyles.wrap} data-testid="want-cravings-action-box">
      {!open ? (
        <div style={wantActStyles.triggerRow}>
          <button
            type="button"
            style={showOwnerFlow ? wantActStyles.triggerPrimary : wantActStyles.trigger}
            data-testid="want-cravings-action-open"
            onClick={() => {
              setSelectedKey(options[0]?.key || "");
              setMode("join_me");
              setError("");
              setOpen(true);
            }}
          >
            {showOwnerFlow ? "Join Me / Take Me Out" : "Invite Me Out"}
          </button>
        </div>
      ) : showPeerInvite ? (
        <div style={wantActStyles.sheet} data-testid="want-cravings-action-sheet">
          <div style={wantActStyles.sheetHead}>
            <span style={wantActStyles.sheetTitle}>Invite Me Out</span>
            <button
              type="button"
              style={wantActStyles.close}
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <button
            type="button"
            style={wantActStyles.actionBtn}
            data-testid="want-cravings-action-invite"
            onClick={() => {
              onInviteMeOut();
              setOpen(false);
            }}
          >
            Invite Me Out
          </button>
        </div>
      ) : (
        <div style={wantActStyles.sheet} data-testid="want-cravings-action-sheet">
          <div style={wantActStyles.sheetHead}>
            <span style={wantActStyles.sheetTitle}>Join Me / Take Me Out</span>
            <button
              type="button"
              style={wantActStyles.close}
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <label style={wantActStyles.fieldLabel} htmlFor="want-craving-pick">
            Craving
          </label>
          <select
            id="want-craving-pick"
            style={wantActStyles.select}
            value={selected?.key || ""}
            onChange={(e) => setSelectedKey(e.target.value)}
            data-testid="want-cravings-action-item"
          >
            {options.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
          <fieldset style={wantActStyles.modeFieldset} data-testid="want-cravings-mode">
            <legend style={wantActStyles.fieldLabel}>How should this work?</legend>
            <label style={wantActStyles.modeOption}>
              <input
                type="radio"
                name="craving-outing-mode"
                value="join_me"
                checked={mode === "join_me"}
                onChange={() => setMode("join_me")}
                data-testid="want-cravings-mode-join-me"
              />
              <span>
                <strong>Join Me</strong>
                <span style={wantActStyles.modeHint}>
                  You’re hosting — open a plan and let people join you.
                </span>
              </span>
            </label>
            <label style={wantActStyles.modeOption}>
              <input
                type="radio"
                name="craving-outing-mode"
                value="take_me_out"
                checked={mode === "take_me_out"}
                onChange={() => setMode("take_me_out")}
                data-testid="want-cravings-mode-take-me-out"
              />
              <span>
                <strong>Take Me Out</strong>
                <span style={wantActStyles.modeHint}>
                  Ask someone to take you out for this craving.
                </span>
              </span>
            </label>
          </fieldset>
          {error ? (
            <p style={wantActStyles.error} data-testid="want-cravings-action-error">
              {error}
            </p>
          ) : null}
          <button
            type="button"
            style={wantActStyles.continueBtn}
            data-testid="want-cravings-action-continue"
            onClick={handleContinue}
          >
            {mode === "take_me_out" ? "Continue to invite" : "Pick a date"}
          </button>
        </div>
      )}
    </div>
  );
}

const wantActStyles = {
  wrap: { marginTop: 8 },
  triggerRow: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 10,
  },
  trigger: {
    appearance: "none",
    border: "1px solid #e2e8f0",
    background: "#fff",
    color: "#334155",
    borderRadius: 999,
    padding: "6px 12px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  },
  triggerPrimary: {
    appearance: "none",
    border: "none",
    background: GREEN_MID,
    color: "#fff",
    borderRadius: 999,
    padding: "8px 14px",
    fontSize: 13,
    fontWeight: 750,
    cursor: "pointer",
  },
  sheet: {
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: 10,
    background: "#f8fafc",
    display: "grid",
    gap: 8,
  },
  sheetHead: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  sheetTitle: { fontSize: 12, fontWeight: 750, color: "#0f172a" },
  close: {
    appearance: "none",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    color: "#64748b",
    fontSize: 14,
    padding: 4,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  select: {
    width: "100%",
    borderRadius: 8,
    border: "1px solid #cbd5e1",
    padding: "8px 10px",
    fontSize: 13,
    background: "#fff",
  },
  modeFieldset: {
    margin: 0,
    padding: 0,
    border: "none",
    display: "grid",
    gap: 8,
  },
  modeOption: {
    display: "flex",
    gap: 8,
    alignItems: "flex-start",
    fontSize: 13,
    color: "#0f172a",
    cursor: "pointer",
  },
  modeHint: {
    display: "block",
    marginTop: 2,
    fontSize: 12,
    fontWeight: 500,
    color: "#64748b",
    lineHeight: 1.35,
  },
  error: { margin: 0, fontSize: 12, color: "#b91c1c", fontWeight: 600 },
  continueBtn: {
    appearance: "none",
    border: "none",
    background: GREEN_MID,
    color: "#fff",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 13,
    fontWeight: 750,
    cursor: "pointer",
  },
  actionBtn: {
    appearance: "none",
    border: "1px solid #bbf7d0",
    background: "#fff",
    color: GREEN_MID,
    borderRadius: 8,
    padding: "6px 10px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  },
};

function EatingDayNavInline({
  hubDate,
  today,
  canGoBack,
  canGoForward,
  onPrev,
  onNext,
  onJumpToday,
}) {
  return (
    <div style={s.inlineDayNav} data-testid="eating-day-nav">
      <span style={s.inlineDayNavJournal}>Journal day</span>
      <button
        type="button"
        style={{ ...s.inlineDayNavBtn, ...(!canGoBack ? s.inlineDayNavBtnDisabled : null) }}
        disabled={!canGoBack}
        onClick={onPrev}
        aria-label="Previous day"
      >
        ‹
      </button>
      <span style={s.inlineDayNavLabel}>{formatInlineDayLabel(hubDate, today)}</span>
      <button
        type="button"
        style={{ ...s.inlineDayNavBtn, ...(!canGoForward ? s.inlineDayNavBtnDisabled : null) }}
        disabled={!canGoForward}
        onClick={onNext}
        aria-label="Next day"
      >
        ›
      </button>
      {hubDate !== today ? (
        <button type="button" style={s.dayNavToday} onClick={onJumpToday}>
          Today
        </button>
      ) : null}
    </div>
  );
}

export function PlansCalendarGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden fill="none">
      <rect x="3" y="5" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 3v4M16 3v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function EatingHubSection({
  readOnly = false,
  /** Owner page: false when previewing Connect view. Peer pages stay readOnly. */
  editMode = true,
  diaryHref = "/account/what-i-ate",
  inviteHref = "/account/what-we-doing",
  joinMeHref = "",
  hubDate,
  onHubDateChange,
  hubMonth,
  onHubMonthChange,
  calendarOpen,
  onCalendarOpenChange,
  calendarTitle: calendarTitleProp = null,
  onCalendarTitleChange = null,
  dayMarkers = [],
  calendarEvents = [],
  eating = [],
  scheduledPlans = [],
  shownPlans = [],
  selectedPlanKey = "",
  onSelectedPlanKeyChange,
  schedulingPlans = false,
  onSchedulingPlansChange,
  wants = [],
  diningIntents = [],
  wantListError = "",
  wantDiscovery = null,
  onDismissWantDiscovery,
  liked = [],
  lastPost = null,
  postBusy = "",
  uploadPercent = null,
  followed = [],
  joinCandidates = [],
  onComposeSubmit,
  activityDisplayName = null,
  activityAvatarUrl = null,
  onPlanSchedule,
  onPostPlan,
  onEatingPhotoPick,
  onWantSelect,
  onDiarySelect,
  onDiaryDelete,
  /** Edit View: update diary entry eaten_at (ISO). */
  onDiaryEatenAtChange = null,
  diaryEatenAtBusy = false,
  /** Profile setting: hide clock after meal period. */
  omitMealClock = false,
  diaryDeleteBusy = false,
  onWantDelete,
  onDiningIntentDelete,
  wantDeleteBusy = false,
  diningIntentDeleteBusy = false,
  onPlanAddDetails,
  onPlanAddVideo,
  onPlanDelete,
  planDeleteBusy = false,
  onPlanJoinMeToggle = null,
  planJoinMeBusy = false,
  onPostTagged,
  onSkipDetails,
  foodHref,
  sectionRef = null,
  composeOpen: composeOpenProp,
  onComposeOpenChange,
  composeDefaultCategory = "ate",
  composeMediaSource = "camera",
  onComposeMediaSourceChange,
  planPrefill = null,
  locationCity = null,
  locationState = null,
  favoriteFoods = [],
  viewerUserId = null,
  onInviteMeOut,
  viewerMayInviteMeOut = false,
  inviteMeOutOpen = false,
  inviteMeOutAudience = "connections",
  inviteMeOutSelectedIds = [],
  inviteMeOutCandidates = [],
  onInviteMeOutSave,
  inviteMeOutToggleBusy = false,
  dinerSocialDefaults = null,
  onDinerSocialDefaultsSave,
  socialDefaultsBusy = false,
  onViewMmt,
  onJoinMeFromCraving,
  onTakeMeOutFromCraving,
}) {
  void liked;
  void foodHref;
  void favoriteFoods;

  const navigate = useNavigate();
  const canEdit = !readOnly && editMode !== false;
  /** Own profile Connect preview — same prose as peer, but no redundant owner avatar/thumb. */
  const isConnectPreview = !readOnly && editMode === false;
  const rowDisplayName = activityDisplayName || (readOnly ? "Diner" : "You");
  const rowAvatarUrl = activityAvatarUrl || null;
  const [composeOpenLocal, setComposeOpenLocal] = useState(false);
  const composeOpen = composeOpenProp ?? composeOpenLocal;
  const setComposeOpen = onComposeOpenChange ?? setComposeOpenLocal;
  const [ateStatusComposeOpen, setAteStatusComposeOpen] = useState(false);
  const [wantStatusComposeOpen, setWantStatusComposeOpen] = useState(false);
  const [calendarTitleLocal, setCalendarTitleLocal] = useState("Eating");
  const calendarTitle = calendarTitleProp ?? calendarTitleLocal;
  const setCalendarTitle = onCalendarTitleChange ?? setCalendarTitleLocal;
  const [composeDefaultMeal, setComposeDefaultMeal] = useState(defaultWhatIAteMealPeriod());
  const [composeInitialFile, setComposeInitialFile] = useState(null);

  function setMediaSource(next) {
    onComposeMediaSourceChange?.(next);
  }

  function closeCompose() {
    setComposeOpen(false);
    setComposeInitialFile(null);
    setMediaSource("camera");
  }

  const today = whatIAteTodayLocalDate();
  const lookbackStart = eatingHistoryStart(today);
  const dateCmp = compareYmd(hubDate, today);
  const canGoBack = compareYmd(hubDate, lookbackStart) > 0;
  const canGoForward = true;

  /** Selected journal day only — never fall back to other days' media. */
  const eatingForDay = useMemo(
    () =>
      eating.filter((row) => {
        const day =
          calendarDayYmd(row.eaten_on) ||
          calendarDayYmd(row.created_at) ||
          planYmd(row.eaten_on || row.created_at);
        if (day === hubDate) return true;
        if (lastPost?.kind === "diary" && Number(row.entry_id) === Number(lastPost.id)) {
          const lastDay = calendarDayYmd(lastPost.eaten_on) || planYmd(lastPost.eaten_on);
          return lastDay === hubDate || !lastPost.eaten_on;
        }
        return false;
      }),
    [eating, hubDate, lastPost]
  );
  const mealsForDay = useMemo(() => groupHubAteMeals(eatingForDay), [eatingForDay]);

  function openEatingCalendar() {
    setCalendarTitle("Eating");
    onCalendarOpenChange(true);
  }

  function openPlansCalendar() {
    setCalendarTitle("My Eating Plans");
    onCalendarOpenChange(true);
  }

  function handleCalendarDate(ymd) {
    const cmp = compareYmd(ymd, today);
    if (cmp > 0) {
      onHubDateChange(ymd);
      onSchedulingPlansChange?.(true);
      const match = scheduledPlans.find((plan) => planYmd(plan.plan_date) === ymd);
      if (match) onSelectedPlanKeyChange?.(futurePlanKey(match));
      return;
    }
    const clamped = clampEatingLookbackDate(ymd, today);
    onHubDateChange(clamped);
    onSchedulingPlansChange?.(false);
  }

  function goDay(delta) {
    const next = shiftYmd(hubDate, delta, today);
    handleCalendarDate(next);
  }

  function handleCalendarEvent(event) {
    onHubDateChange(event.ymd);
    const d = new Date(`${event.ymd}T12:00:00`);
    if (!Number.isNaN(d.getTime())) {
      onHubMonthChange?.(new Date(d.getFullYear(), d.getMonth(), 1));
    }
    if (event.kind === "venue_event" && event.href) {
      onSchedulingPlansChange?.(false);
      navigate(event.href);
      return;
    }
    onSelectedPlanKeyChange?.(event.key);
    onSchedulingPlansChange?.(false);
  }

  function openPlanOnCalendar(plan) {
    const ymd = planYmd(plan?.plan_date);
    if (!ymd) return;
    const d = new Date(`${ymd}T12:00:00`);
    if (!Number.isNaN(d.getTime())) {
      onHubMonthChange?.(new Date(d.getFullYear(), d.getMonth(), 1));
    }
    onHubDateChange(ymd);
    onSelectedPlanKeyChange?.(futurePlanKey(plan));
    onSchedulingPlansChange?.(false);
    setCalendarTitle("My Eating Plans");
    onCalendarOpenChange(true);
  }

  const canInviteMeOut =
    readOnly &&
    viewerMayInviteMeOut &&
    typeof onInviteMeOut === "function" &&
    wants.some((row) => row?.restaurant_id != null && String(row.restaurant_id).trim() !== "");

  // Join Me is per plan instance — never prefill from section-wide diner_social_defaults.
  const planJoinablePrefill =
    planPrefill?.joinable != null ? Boolean(planPrefill.joinable) : false;
  const planJoinAudiencePrefill =
    planPrefill?.joinAudience != null
      ? planPrefill.joinAudience
      : "connections";
  const planJoinIdsPrefill = Array.isArray(planPrefill?.joinAllowedUserIds)
    ? planPrefill.joinAllowedUserIds
    : [];
  const planJoinCapacityPrefill =
    planPrefill?.joinCapacity != null ? String(planPrefill.joinCapacity) : "4";

  return (
    <div data-testid="eating" ref={sectionRef}>
      <section style={s.section} data-testid="what-im-eating">
        {wantDiscovery && lastPost?.kind === "diary" ? (
          <WantDiscoveryPanel
            discovery={wantDiscovery}
            mode="ate"
            onClose={onDismissWantDiscovery}
          />
        ) : null}
        <SectionHeader
          {...PROFILE_SECTION_HEADERS.eating}
          to={readOnly ? diaryHref : "/account/what-i-ate"}
          testId="what-im-eating-section-header"
          aside={
            <div style={styles.sectionHeadActions}>
              {canEdit ? (
                <button
                  type="button"
                  style={styles.compactAdd}
                  data-testid="status-compose-open"
                  disabled={postBusy === "eating"}
                  onClick={() => setAteStatusComposeOpen(true)}
                >
                  <span aria-hidden="true">+</span> Add
                </button>
              ) : null}
              <EatingDayNavInline
                hubDate={hubDate}
                today={today}
                canGoBack={canGoBack}
                canGoForward={canGoForward}
                onPrev={() => goDay(-1)}
                onNext={() => goDay(1)}
                onJumpToday={() => handleCalendarDate(today)}
              />
              <DinerCalendarTrigger selectedDate={hubDate} onOpen={openEatingCalendar} />
            </div>
          }
        />

        <div data-testid="eating-ate-panel">
          <p style={styles.hubDateHeading} data-testid="eating-hub-date-heading">
            {formatEatingHubDateHeading(hubDate)}
          </p>
          {canEdit ? (
            <ActivityStatusLineCompose
              category="ate"
              hideTrigger
              open={ateStatusComposeOpen}
              onOpenChange={setAteStatusComposeOpen}
              busy={postBusy === "eating"}
              followed={followed}
              locationCity={locationCity}
              locationState={locationState}
              onSubmit={async (payload) => {
                await onComposeSubmit?.(payload);
              }}
            />
          ) : null}
          {mealsForDay.length > 0 ? (
            <ul
              style={{ listStyle: "none", margin: "0 0 12px", padding: 0 }}
              data-testid="eating-activity-rows"
            >
              {mealsForDay.map((meal, index) => {
                const foodParts = splitMealFoodLead(meal);
                const food = foodParts.primary || meal.food_name;
                const secondaryFood = foodParts.secondary || "";
                const homemade = Boolean(meal.homemade);
                const primary = meal.primaryItem || meal.items?.[0] || meal;
                return (
                  <li key={`act-${meal.id}`}>
                    <DinerActivityScanRow
                      displayName={rowDisplayName}
                      avatarUrl={rowAvatarUrl}
                      includeSex={Boolean(readOnly)}
                      kind="ate"
                      foodName={food}
                      secondaryFoodName={secondaryFood}
                      restaurantName={meal.restaurant_name}
                      restaurantId={meal.restaurant_id || null}
                      restaurantSlug={meal.restaurant_slug || null}
                      restaurantCity={meal.restaurant_city || null}
                      restaurantState={meal.restaurant_state || null}
                      restaurantLogoUrl={meal.restaurant_logo_url || null}
                      restaurantBillboardUrl={meal.restaurant_billboard_image_url || null}
                      restaurantChainId={meal.chain_id || null}
                      menuItemId={meal.menu_item_id || null}
                      dishPhotoUrl={meal.photo_url || null}
                      mealPeriod={meal.meal_period}
                      eatenAt={meal.eaten_at || null}
                      omitMealClock={omitMealClock}
                      homemade={homemade}
                      videoUrl={meal.video_url || null}
                      ownerCompact
                      timelineFirst={index === 0}
                      timelineLast={index === mealsForDay.length - 1}
                      showIdentity={false}
                      showThumb={false}
                      nameInProse={false}
                      placeAsText={isConnectPreview || readOnly}
                      selected={
                        Boolean(
                          lastPost?.kind === "diary" &&
                            Number(lastPost?.id) === Number(primary?.entry_id || primary?.id)
                        )
                      }
                      onSelect={
                        canEdit && onDiarySelect
                          ? () => onDiarySelect(primary)
                          : null
                      }
                      onDelete={
                        canEdit && typeof onDiaryDelete === "function"
                          ? () => onDiaryDelete(primary)
                          : null
                      }
                      deleteBusy={diaryDeleteBusy}
                      deleteLabel={`Delete ${food || "meal"}`}
                    />
                  </li>
                );
              })}
            </ul>
          ) : null}
          {lastPost?.kind === "diary" && canEdit && typeof onDiaryEatenAtChange === "function" ? (
            <div style={clockStyles.wrap} data-testid="eating-meal-clock-edit">
              <label style={clockStyles.label} htmlFor="eating-meal-clock-input">
                Meal clock time
              </label>
              <input
                id="eating-meal-clock-input"
                type="time"
                data-testid="eating-meal-clock-input"
                disabled={diaryEatenAtBusy || omitMealClock}
                value={isoToTimeInputValue(lastPost.eaten_at)}
                style={{
                  appearance: "none",
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  padding: "6px 10px",
                  font: "inherit",
                  fontSize: 14,
                  fontWeight: 650,
                  color: "#0f172a",
                  background: "#fff",
                }}
                onChange={(e) => {
                  const nextIso = timeInputToIso(e.target.value, lastPost.eaten_at || lastPost.eaten_on);
                  if (nextIso) onDiaryEatenAtChange(lastPost, nextIso);
                }}
              />
              {omitMealClock ? (
                <p style={clockStyles.hint}>Hidden on your profile — turn off “Omit meal clock time” in Settings to show it.</p>
              ) : (
                <p style={clockStyles.hint}>Auto-filled when you logged the meal. Change anytime.</p>
              )}
            </div>
          ) : null}
          {lastPost?.kind === "diary" &&
          canEdit &&
          !lastPost.restaurant_id &&
          !lastPost.homemade ? (
            <PostAfterActions
              kind="diary"
              record={lastPost}
              busy={postBusy === "eating"}
              followed={followed}
              locationCity={locationCity}
              locationState={locationState}
              onTagged={onPostTagged}
              onSkip={onSkipDetails}
            />
          ) : null}
          {mealsForDay.length === 0 && lastPost?.kind !== "diary" ? (
            <SectionEmptyState testId="eating-ate-empty-day">
              {canEdit ? "Nothing logged for this day yet." : "Nothing shared for this day."}
            </SectionEmptyState>
          ) : null}
        </div>
      </section>

      {/* Who's Eating — continuous-line discovery (owner hub) */}
      <NearbyEatingSection
        hidden={readOnly || !canEdit}
        locationCity={locationCity}
        locationState={locationState}
        viewerUserId={viewerUserId}
      />

      <section style={s.section} data-testid="want-to-eat">
        {wantDiscovery && lastPost?.kind !== "diary" ? (
          <WantDiscoveryPanel
            discovery={wantDiscovery}
            mode="want"
            onClose={onDismissWantDiscovery}
          />
        ) : null}
        <div data-testid="eating-want-panel" style={s.presentationBlock}>
          <SectionHeader
            {...PROFILE_SECTION_HEADERS.wannaEat}
            testId="wanna-eat-section-header"
            aside={
              canEdit ? (
                <button
                  type="button"
                  style={styles.compactAdd}
                  data-testid="status-compose-open"
                  disabled={postBusy === "want"}
                  onClick={() => setWantStatusComposeOpen(true)}
                >
                  <span aria-hidden="true">+</span> Add
                </button>
              ) : null
            }
          />
          {canEdit ? (
            <DinerSocialPresetsPanel
              canEdit={canEdit}
              scope="wanna-eat"
              inviteMeOutOpen={inviteMeOutOpen}
              inviteMeOutAudience={inviteMeOutAudience}
              inviteMeOutSelectedIds={inviteMeOutSelectedIds}
              inviteMeOutCandidates={inviteMeOutCandidates}
              onInviteMeOutSave={onInviteMeOutSave}
              inviteMeOutToggleBusy={inviteMeOutToggleBusy}
              dinerSocialDefaults={dinerSocialDefaults}
              onDinerSocialDefaultsSave={onDinerSocialDefaultsSave}
              socialDefaultsBusy={socialDefaultsBusy}
              joinCandidates={joinCandidates}
            />
          ) : null}
          {canEdit ? (
            <ActivityStatusLineCompose
              category="want"
              hideTrigger
              open={wantStatusComposeOpen}
              onOpenChange={setWantStatusComposeOpen}
              busy={postBusy === "want"}
              followed={followed}
              locationCity={locationCity}
              locationState={locationState}
              onSubmit={async (payload) => {
                await onComposeSubmit?.(payload);
              }}
            />
          ) : null}
          {wantListError ? <p style={s.error}>{wantListError}</p> : null}
          {lastPost?.kind === "want" &&
          canEdit &&
          !lastPost.restaurant_id &&
          !wants.some((row) => Number(row.id) === Number(lastPost.id)) ? (
            <div style={s.card} data-testid="want-to-eat-just-posted">
              <div style={{ fontWeight: 800 }}>{lastPost.food_name}</div>
            </div>
          ) : null}
          {lastPost?.kind === "want" && canEdit && !lastPost.restaurant_id ? (
            <PostAfterActions
              kind="want"
              record={lastPost}
              busy={postBusy === "want"}
              followed={followed}
              locationCity={locationCity}
              locationState={locationState}
              onTagged={onPostTagged}
            />
          ) : null}
          {wants.length === 0 &&
          diningIntents.length === 0 &&
          lastPost?.kind !== "want" ? (
            <SectionEmptyState testId="want-to-eat-empty">
              {canEdit ? "Add a craving anytime." : "No cravings shared yet."}
            </SectionEmptyState>
          ) : null}
          <WantToEatUnifiedList
            wants={wants}
            diningIntents={diningIntents}
            readOnly={!canEdit}
            layout="scroll"
            onSelectItem={canEdit ? onWantSelect : undefined}
            onDeleteWant={canEdit ? onWantDelete : undefined}
            onDeleteDiningIntent={canEdit ? onDiningIntentDelete : undefined}
            deleteBusy={wantDeleteBusy || diningIntentDeleteBusy}
            onViewMmt={onViewMmt}
          />
          <WantCravingsActionBox
            wants={wants}
            diningIntents={diningIntents}
            canEdit={canEdit}
            isConnectPreview={isConnectPreview}
            canInviteMeOut={canInviteMeOut}
            onJoinMeFromCraving={onJoinMeFromCraving}
            onTakeMeOutFromCraving={onTakeMeOutFromCraving}
            onInviteMeOut={onInviteMeOut}
          />
        </div>
      </section>

      <section style={s.section} data-testid="eating-plans">
        <div data-testid="eating-plans-panel" style={{ ...s.presentationBlock, ...s.plansPanel }}>
          <SectionHeader
            {...PROFILE_SECTION_HEADERS.plans}
            testId="eating-plans-section-header"
            aside={
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {canEdit ? (
                  <button
                    type="button"
                    style={styles.compactAdd}
                    data-testid="plans-compose-open"
                    onClick={() => {
                      onSchedulingPlansChange?.(true);
                      openPlansCalendar();
                    }}
                  >
                    <span aria-hidden="true">+</span> Add
                  </button>
                ) : null}
                <button
                  type="button"
                  style={s.plansCalendarBtn}
                  data-testid="upcoming-plans-calendar-open"
                  aria-label="Open month calendar for eating plans"
                  onClick={openPlansCalendar}
                >
                  <PlansCalendarGlyph />
                </button>
              </div>
            }
          />

          {shownPlans.length === 0 ? (
            <div data-testid="future-plans-summary">
              <SectionEmptyState testId="eating-plans-empty">
                {canEdit ? "No plans yet." : "No upcoming plans."}
              </SectionEmptyState>
            </div>
          ) : (
            shownPlans.map((plan) => {
              const key = futurePlanKey(plan);
              return (
                <FuturePlanRow
                  key={key}
                  plan={plan}
                  open={selectedPlanKey === key}
                  onToggle={() =>
                    onSelectedPlanKeyChange?.(selectedPlanKey === key ? "" : key)
                  }
                  onOpenCalendar={openPlanOnCalendar}
                  onAddDetails={canEdit ? onPlanAddDetails : undefined}
                  onAddPlanVideo={canEdit ? onPlanAddVideo : undefined}
                  onDelete={
                    !canEdit || !onPlanDelete || plan?.is_creator !== true
                      ? undefined
                      : onPlanDelete
                  }
                  deleteBusy={planDeleteBusy}
                  onJoinMeToggle={canEdit ? onPlanJoinMeToggle : undefined}
                  joinMeBusy={planJoinMeBusy}
                />
              );
            })
          )}

          {lastPost?.kind === "plan" && canEdit ? (
            <PostAfterActions
              kind="plan"
              record={lastPost}
              busy={postBusy === "eating"}
              followed={followed}
              locationCity={locationCity}
              locationState={locationState}
              onTagged={onPostTagged}
            />
          ) : null}

          {/* Join Me — peer hub only (never own Connect-view / followed-restaurants chrome) */}
          {readOnly && isJoinMeGuestHref(joinMeHref) ? (
            <p style={{ ...s.muted, fontSize: 13, marginTop: 10 }} data-testid="plans-join-me">
              <Link to={joinMeHref} style={s.plansEmptyLink}>
                Join Me
              </Link>
              {" — "}
              join me for this meal.
            </p>
          ) : null}
          {canEdit ? (
            <p style={{ ...s.muted, fontSize: 12, marginTop: 6 }}>
              Only people you open Join Me to can see that future plan.
            </p>
          ) : null}
        </div>
      </section>

      <DinerCalendarSheet
        open={calendarOpen}
        onClose={() => onCalendarOpenChange(false)}
        testId="eating-calendar"
        title={calendarTitle}
        selectedDate={hubDate}
        onSelectDate={handleCalendarDate}
        onSelectEvent={handleCalendarEvent}
        viewMonth={hubMonth}
        onViewMonthChange={onHubMonthChange}
        dayMarkers={dayMarkers}
        lookbackStart={lookbackStart}
        events={calendarEvents}
      />

      {canEdit ? (
        <EatingComposeSheet
          open={composeOpen}
          onClose={closeCompose}
          defaultCategory={composeDefaultCategory}
          defaultMealPeriod={composeDefaultMeal}
          initialFile={composeInitialFile}
          mediaSource={composeMediaSource}
          openLibraryOnMount={composeMediaSource === "library"}
          busy={postBusy === "eating" || postBusy === "want"}
          uploadPercent={uploadPercent}
          onSubmit={onComposeSubmit}
          onPlanSchedule={onPlanSchedule}
          followed={followed}
          locationCity={locationCity}
          locationState={locationState}
          inviteMeOutOpen={inviteMeOutOpen}
          inviteMeOutAudience={inviteMeOutAudience}
          inviteMeOutSelectedIds={inviteMeOutSelectedIds}
          inviteMeOutCandidates={inviteMeOutCandidates}
        />
      ) : null}

      {canEdit && schedulingPlans ? (
        <div
          role="presentation"
          style={styles.planSheetBackdrop}
          data-testid="eating-plan-compose-sheet"
          onClick={() => onSchedulingPlansChange?.(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Schedule eating plan"
            style={styles.planSheetPanel}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.planSheetHead}>
              <p style={styles.planSheetTitle}>Eating plan</p>
              <button
                type="button"
                style={styles.planSheetClose}
                onClick={() => onSchedulingPlansChange?.(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <EatingPlanDayForm
              key={[
                dateCmp > 0 ? hubDate : today,
                planPrefill?.restaurant?.restaurant_id || "",
                planPrefill?.dish?.menu_item_id || planPrefill?.dish?.item_name || "",
                planJoinablePrefill ? "join" : "solo",
                planJoinAudiencePrefill,
                planJoinCapacityPrefill,
              ].join("|")}
              planDate={dateCmp > 0 ? hubDate : today}
              busy={postBusy === "eating"}
              followed={followed}
              joinCandidates={joinCandidates}
              initialHomemade={Boolean(planPrefill?.homemade)}
              initialRestaurant={planPrefill?.restaurant || null}
              initialDish={planPrefill?.dish || null}
              initialNote={planPrefill?.text || ""}
              initialJoinable={planJoinablePrefill}
              initialJoinAudience={planJoinAudiencePrefill}
              initialJoinAllowedUserIds={planJoinIdsPrefill}
              initialJoinCapacity={planJoinCapacityPrefill}
              locationCity={locationCity}
              locationState={locationState}
              onSubmit={onPostPlan}
            />
          </div>
        </div>
      ) : null}

    </div>
  );
}

const styles = {
  sectionHeadActions: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  hubDateHeading: {
    margin: "0 0 10px",
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: "-0.02em",
    color: "#1F1E1D",
    lineHeight: 1.3,
  },
  compactAdd: {
    appearance: "none",
    border: "1px dashed #cbd5e1",
    background: "#fff",
    borderRadius: 999,
    padding: "6px 12px",
    font: "inherit",
    fontSize: 13,
    fontWeight: 700,
    color: GREEN_MID,
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    cursor: "pointer",
  },
  connectActions: {
    display: "flex",
    gap: 8,
    margin: "0 0 12px",
  },
  connectActionBtn: {
    appearance: "none",
    textDecoration: "none",
    border: "1px solid #bbf7d0",
    background: "rgba(22, 163, 74, 0.08)",
    borderRadius: 999,
    padding: "8px 14px",
    fontSize: 13,
    fontWeight: 750,
    color: "#166534",
  },
  planSheetBackdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.48)",
    zIndex: 1100,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    padding: "0 12px calc(var(--bottom-nav-h, 72px) + 12px)",
  },
  planSheetPanel: {
    width: "100%",
    maxWidth: 480,
    background: "#fff",
    borderRadius: "20px 20px 14px 14px",
    padding: "16px 16px 20px",
    boxShadow: "0 -12px 40px rgba(15, 23, 42, 0.18)",
    maxHeight: "min(88vh, 640px)",
    overflowY: "auto",
  },
  planSheetHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 10,
  },
  planSheetTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 800,
    color: "#0f172a",
  },
  planSheetClose: {
    appearance: "none",
    border: "none",
    background: "rgba(120,120,128,0.12)",
    width: 32,
    height: 32,
    borderRadius: "50%",
    fontSize: 16,
    cursor: "pointer",
  },
};

const clockStyles = {
  wrap: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 10,
    margin: "0 0 12px",
    padding: "10px 12px",
    borderRadius: 12,
    background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
    border: "1px solid #e2e8f0",
  },
  label: {
    fontSize: 12,
    fontWeight: 700,
    color: "#334155",
  },
  hint: {
    margin: 0,
    flex: "1 1 100%",
    fontSize: 12,
    lineHeight: 1.35,
    color: "#64748b",
  },
};
