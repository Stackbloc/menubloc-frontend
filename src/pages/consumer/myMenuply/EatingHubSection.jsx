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
import * as s from "./myMenuplyStyles.js";

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
  onPlanAddDetails,
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

  return (
    <div data-testid="eating" ref={sectionRef}>
      <section style={s.section} data-testid="what-im-eating">
        <SectionHead
          title="What I'm Eating"
          to={readOnly ? diaryHref : "/account/what-i-ate"}
          aside={<DinerCalendarTrigger selectedDate={hubDate} onOpen={openEatingCalendar} />}
        />

        <div style={s.dayNavShell} data-testid="eating-day-nav">
          <button
            type="button"
            style={{ ...s.dayNavBtn, ...(!canGoBack ? s.dayNavBtnDisabled : null) }}
            disabled={!canGoBack}
            onClick={() => goDay(-1)}
            aria-label="Previous day"
          >
            ‹
          </button>
          <div style={{ textAlign: "center" }}>
            <span style={s.dayNavSub}>Journal day</span>
            <span style={s.dayNavLabel}>
              {hubDate === today ? "Today" : formatPlanBracketDate(hubDate)}
            </span>
            {hubDate !== today ? (
              <button type="button" style={s.dayNavToday} onClick={() => handleCalendarDate(today)}>
                Jump to today
              </button>
            ) : null}
          </div>
          <button
            type="button"
            style={s.dayNavBtn}
            disabled={!canGoForward}
            onClick={() => goDay(1)}
            aria-label="Next day"
          >
            ›
          </button>
        </div>

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
            onPhotoPick={readOnly ? undefined : onEatingPhotoPick}
          />
          {eatingForDay.length === 0 && lastPost?.kind !== "diary" ? (
            <SectionEmptyState testId="eating-ate-empty-day">
              The food you&apos;re sharing with the world.
            </SectionEmptyState>
          ) : null}
        </div>
      </section>

      <section style={s.section} data-testid="want-to-eat">
        <div data-testid="eating-want-panel" style={s.presentationBlock}>
          <SectionHead title="What I Want to Eat" />
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
            emptyMessage={null}
          />
          {/* Invite Me = invitation eligibility for a want (“eat this together”). */}
          {!readOnly ? (
            <p style={{ ...s.muted, fontSize: 13, marginTop: 10 }} data-testid="want-invite-me">
              <Link to={inviteHref} style={s.plansEmptyLink}>
                Invite Me
              </Link>
              {" — "}
              invite me out so we can eat this together.
            </p>
          ) : null}
        </div>
      </section>

      <section style={s.section} data-testid="eating-plans">
        <div data-testid="eating-plans-panel" style={{ ...s.presentationBlock, ...s.plansPanel }}>
          <SectionHead
            title="My Eating Plans"
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
        />
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
