/**
 * My Menuply food sections — presentation only.
 * Creation opens via bottom-nav X → EatingComposeSheet / plan sheet.
 * Owner + peer share this module (peer: readOnly).
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DinerCalendarSheet, { DinerCalendarTrigger } from "./DinerCalendarSheet.jsx";
import EatingComposeSheet from "./EatingComposeSheet.jsx";
import EatingPlanDayForm from "./EatingPlanDayForm.jsx";
import PostAfterActions from "./PostAfterActions.jsx";
import WhatIAteMealBoard from "./WhatIAteMealBoard.jsx";
import SectionEmptyState from "./SectionEmptyState.jsx";
import {
  SectionHead,
  FuturePlanRow,
  WantToEatList,
} from "./myMenuplyBits.jsx";
import {
  clampEatingLookbackDate,
  compareYmd,
  eatingHistoryStart,
  planYmd,
  shiftYmd,
} from "./eatingHubUtils.js";
import { formatPlanBracketDate, futurePlanKey } from "./dinerHubFormat.js";
import { whatIAteTodayLocalDate } from "../../../lib/consumerApi.js";
import { defaultWhatIAteMealPeriod } from "../../../lib/whatIAteTodayMealPeriod.js";
import InviteMeOutAudiencePicker from "./InviteMeOutAudiencePicker.jsx";
import WantDiscoveryPanel from "./WantDiscoveryPanel.jsx";
import NearbyEatingSection from "./NearbyEatingSection.jsx";
import SocialFoodInfoSection from "./SocialFoodInfoSection.jsx";
import MealIntelSection from "./MealIntelSection.jsx";
import * as s from "./myMenuplyStyles.js";

function formatInlineDayLabel(hubDate, today) {
  if (hubDate === today) return "Today";
  return formatPlanBracketDate(hubDate);
}

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
  wantListError = "",
  wantDiscovery = null,
  onDismissWantDiscovery,
  liked = [],
  lastPost = null,
  postBusy = "",
  followed = [],
  joinCandidates = [],
  onComposeSubmit,
  onPlanSchedule,
  onPostPlan,
  onEatingPhotoPick,
  onWantSelect,
  onDiarySelect,
  onDiaryDelete,
  diaryDeleteBusy = false,
  onWantDelete,
  wantDeleteBusy = false,
  onPlanAddDetails,
  onPlanAddVideo,
  onPlanDelete,
  planDeleteBusy = false,
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
  onInviteMeOut,
  viewerMayInviteMeOut = false,
  inviteMeOutOpen = false,
  inviteMeOutAudience = "connections",
  inviteMeOutSelectedIds = [],
  inviteMeOutCandidates = [],
  onInviteMeOutSave,
  inviteMeOutToggleBusy = false,
  onRequestMmt,
  onViewMmt,
}) {
  void liked;
  void foodHref;

  const navigate = useNavigate();
  const [composeOpenLocal, setComposeOpenLocal] = useState(false);
  const composeOpen = composeOpenProp ?? composeOpenLocal;
  const setComposeOpen = onComposeOpenChange ?? setComposeOpenLocal;
  const [calendarTitleLocal, setCalendarTitleLocal] = useState("Eating");
  const calendarTitle = calendarTitleProp ?? calendarTitleLocal;
  const setCalendarTitle = onCalendarTitleChange ?? setCalendarTitleLocal;
  const [composeDefaultMeal, setComposeDefaultMeal] = useState(defaultWhatIAteMealPeriod());
  const [composeInitialFile, setComposeInitialFile] = useState(null);
  const [inviteSettingsOpen, setInviteSettingsOpen] = useState(false);
  const [draftInviteOpen, setDraftInviteOpen] = useState(false);
  const [draftAudience, setDraftAudience] = useState("connections");
  const [draftSelectedIds, setDraftSelectedIds] = useState([]);

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
  const eatingForDay = eating.filter((row) => {
    if (planYmd(row.eaten_on || row.created_at) === hubDate) return true;
    if (lastPost?.kind === "diary" && Number(row.entry_id) === Number(lastPost.id)) {
      return planYmd(lastPost.eaten_on) === hubDate || !lastPost.eaten_on;
    }
    return false;
  });

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

  function openInviteMeOutSettings() {
    setDraftInviteOpen(Boolean(inviteMeOutOpen));
    setDraftAudience(inviteMeOutAudience === "selected" ? "selected" : "connections");
    setDraftSelectedIds(
      Array.isArray(inviteMeOutSelectedIds) ? [...inviteMeOutSelectedIds] : []
    );
    setInviteSettingsOpen(true);
  }

  async function saveInviteMeOutSettings() {
    if (typeof onInviteMeOutSave !== "function") return;
    await onInviteMeOutSave({
      open: draftInviteOpen,
      audience: draftAudience,
      selectedIds: draftSelectedIds,
    });
    setInviteSettingsOpen(false);
  }

  const canInviteMeOut =
    readOnly &&
    viewerMayInviteMeOut &&
    typeof onInviteMeOut === "function" &&
    wants.some((row) => row?.restaurant_id != null && String(row.restaurant_id).trim() !== "");

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
        <SectionHead
          kicker="Today"
          title="What I'm Eating"
          to={readOnly ? diaryHref : "/account/what-i-ate"}
          subtitle="The food you're sharing with the world"
          aside={
            <>
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
            </>
          }
        />

        <div data-testid="eating-ate-panel">
          {lastPost?.kind === "diary" && !readOnly ? (
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
          <WhatIAteMealBoard
            items={eatingForDay}
            readOnly={readOnly}
            hubDate={hubDate}
            todayYmd={today}
            onSelect={readOnly ? undefined : onDiarySelect}
            onDelete={readOnly ? undefined : onDiaryDelete}
            deleteBusy={diaryDeleteBusy}
            onPhotoPick={readOnly ? undefined : onEatingPhotoPick}
          />
          {eatingForDay.length === 0 && lastPost?.kind !== "diary" ? (
            <SectionEmptyState testId="eating-ate-empty-day">
              The food you&apos;re sharing with the world.
            </SectionEmptyState>
          ) : null}
        </div>
      </section>

      {/* Phase 3: discovery entry must precede What I Wanna Eat */}
      <NearbyEatingSection
        hidden={readOnly}
        locationCity={locationCity}
        locationState={locationState}
        favoriteFoods={favoriteFoods}
      />

      {/* Phase 5: connects’ food signals — informational, not matching */}
      <SocialFoodInfoSection hidden={readOnly} />

      {/* Phase 7: Meal Intel from intent — not public Deals; Waiter briefing not modified */}
      <MealIntelSection hidden={readOnly} />

      <section style={s.section} data-testid="want-to-eat">
        {wantDiscovery && lastPost?.kind !== "diary" ? (
          <WantDiscoveryPanel
            discovery={wantDiscovery}
            mode="want"
            onClose={onDismissWantDiscovery}
          />
        ) : null}
        <div data-testid="eating-want-panel" style={s.presentationBlock}>
          <SectionHead
            kicker="Cravings"
            title="What I Wanna Eat"
            subtitle="Dishes and places on your mind"
          />
          {wantListError ? <p style={s.error}>{wantListError}</p> : null}
          {lastPost?.kind === "want" &&
          !readOnly &&
          !wants.some((row) => Number(row.id) === Number(lastPost.id)) ? (
            <div style={s.card} data-testid="want-to-eat-just-posted">
              <div style={{ fontWeight: 800 }}>{lastPost.food_name}</div>
              <div style={{ ...s.muted, fontSize: 12, marginTop: 4 }}>
                Saved — link a restaurant and menu item below
              </div>
            </div>
          ) : null}
          {lastPost?.kind === "want" && !readOnly ? (
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
          {wants.length === 0 && lastPost?.kind !== "want" ? (
            <SectionEmptyState testId="want-to-eat-empty">
              Your cravings, saved dishes, and places you want to try.
            </SectionEmptyState>
          ) : null}
          <WantToEatList
            items={wants}
            readOnly={readOnly}
            layout="scroll"
            onSelectItem={readOnly ? undefined : onWantSelect}
            onDelete={readOnly ? undefined : onWantDelete}
            deleteBusy={wantDeleteBusy}
            onRequestMmt={readOnly ? undefined : onRequestMmt}
            onViewMmt={onViewMmt}
            emptyMessage={null}
          />
          {/* Own hub only: Invite Me Out on/off — opens eligibility dialog (peers never see this). */}
          {!readOnly ? (
            <p
              style={{ ...s.muted, fontSize: 13, marginTop: 10 }}
              data-testid={inviteMeOutOpen ? "want-invite-me-out-on" : "want-invite-me-out-off"}
            >
              <button
                type="button"
                onClick={openInviteMeOutSettings}
                disabled={inviteMeOutToggleBusy}
                style={inviteMeOutButtonStyle}
                data-testid="want-invite-me-out-toggle"
                aria-pressed={inviteMeOutOpen}
              >
                {inviteMeOutOpen ? "Invite Me Out is on" : "Invite Me Out is off"}
              </button>
              {" — "}
              {inviteMeOutOpen
                ? "Connections you allow can invite you out. Tap to change who."
                : "Tap to choose who can invite you out for a restaurant-linked want."}
            </p>
          ) : null}
          {/* Peer hub: actionable link only when viewer is eligible. */}
          {canInviteMeOut ? (
            <p style={{ ...s.muted, fontSize: 13, marginTop: 10 }} data-testid="want-invite-me-out">
              <button
                type="button"
                onClick={onInviteMeOut}
                style={inviteMeOutButtonStyle}
              >
                Invite Me Out
              </button>
              {" — "}
              pick something they want to eat and choose when to go.
            </p>
          ) : null}
        </div>
      </section>

      <section style={s.section} data-testid="eating-plans">
        <div data-testid="eating-plans-panel" style={{ ...s.presentationBlock, ...s.plansPanel }}>
          <SectionHead
            kicker="Coming up"
            title="My Eating Plans"
            subtitle="Meals and outings you've planned"
            aside={
              <button
                type="button"
                style={s.plansCalendarBtn}
                data-testid="upcoming-plans-calendar-open"
                aria-label="Open month calendar for eating plans"
                onClick={openPlansCalendar}
              >
                <PlansCalendarGlyph />
              </button>
            }
          />

          {shownPlans.length === 0 ? (
            <div data-testid="future-plans-summary">
              <SectionEmptyState testId="eating-plans-empty">
                Meals and outings you&apos;ve planned.
              </SectionEmptyState>
              <p style={{ ...s.muted, fontSize: 13, marginTop: 8 }} data-testid="plans-none-scheduled">
                None scheduled
              </p>
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
                  onAddDetails={readOnly ? undefined : onPlanAddDetails}
                  onAddPlanVideo={readOnly ? undefined : onPlanAddVideo}
                  onDelete={
                    readOnly || !onPlanDelete || plan?.is_creator !== true
                      ? undefined
                      : onPlanDelete
                  }
                  deleteBusy={planDeleteBusy}
                />
              );
            })
          )}

          {lastPost?.kind === "plan" && !readOnly ? (
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

          {/* Join Me = join this planned meal. */}
          {joinMeHref ? (
            <p style={{ ...s.muted, fontSize: 13, marginTop: 10 }} data-testid="plans-join-me">
              <Link to={joinMeHref} style={s.plansEmptyLink}>
                Join Me
              </Link>
              {" — "}
              join me for this meal.
            </p>
          ) : null}
          {!readOnly ? (
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

      {!readOnly ? (
        <EatingComposeSheet
          open={composeOpen}
          onClose={closeCompose}
          defaultCategory={composeDefaultCategory}
          defaultMealPeriod={composeDefaultMeal}
          initialFile={composeInitialFile}
          mediaSource={composeMediaSource}
          openLibraryOnMount={composeMediaSource === "library"}
          busy={postBusy === "eating" || postBusy === "want"}
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

      {!readOnly && inviteSettingsOpen ? (
        <div
          role="presentation"
          style={styles.planSheetBackdrop}
          data-testid="invite-me-out-settings-sheet"
          onClick={() => !inviteMeOutToggleBusy && setInviteSettingsOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Invite Me Out settings"
            style={styles.planSheetPanel}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.planSheetHead}>
              <p style={styles.planSheetTitle}>Invite Me Out</p>
              <button
                type="button"
                style={styles.planSheetClose}
                onClick={() => setInviteSettingsOpen(false)}
                aria-label="Close"
                disabled={inviteMeOutToggleBusy}
              >
                ✕
              </button>
            </div>
            <p style={{ ...s.muted, fontSize: 13, margin: "0 0 8px" }}>
              Choose who can invite you out for food you want to eat.
            </p>
            <InviteMeOutAudiencePicker
              open={draftInviteOpen}
              onOpenChange={setDraftInviteOpen}
              audience={draftAudience}
              onAudienceChange={setDraftAudience}
              selectedIds={draftSelectedIds}
              onSelectedIdsChange={setDraftSelectedIds}
              candidates={inviteMeOutCandidates}
              disabled={inviteMeOutToggleBusy}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button
                type="button"
                style={s.primaryBtn}
                data-testid="invite-me-out-settings-save"
                disabled={
                  inviteMeOutToggleBusy ||
                  (draftInviteOpen &&
                    draftAudience === "selected" &&
                    draftSelectedIds.length === 0)
                }
                onClick={() => {
                  void saveInviteMeOutSettings();
                }}
              >
                {inviteMeOutToggleBusy ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                style={s.chipBtn}
                disabled={inviteMeOutToggleBusy}
                onClick={() => setInviteSettingsOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {!readOnly && schedulingPlans ? (
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
              planDate={dateCmp > 0 ? hubDate : today}
              busy={postBusy === "eating"}
              followed={followed}
              joinCandidates={joinCandidates}
              initialHomemade={Boolean(planPrefill?.homemade)}
              initialRestaurant={planPrefill?.restaurant || null}
              initialDish={planPrefill?.dish || null}
              initialNote={planPrefill?.text || ""}
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

const inviteMeOutButtonStyle = {
  appearance: "none",
  border: "none",
  background: "transparent",
  padding: 0,
  cursor: "pointer",
  color: "#166534",
  fontWeight: 800,
  textDecoration: "underline",
  textUnderlineOffset: 2,
  font: "inherit",
};

const styles = {
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
