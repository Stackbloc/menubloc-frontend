/**
 * Unified Eating hub — presentation feed + on-demand compose sheet (input separated).
 * What I Ate = meal-period media board for the selected journal day.
 * Upcoming Plans = bold list + month calendar (Post about unchanged).
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import DinerCalendarSheet, { DinerCalendarTrigger } from "./DinerCalendarSheet.jsx";
import EatingComposeSheet from "./EatingComposeSheet.jsx";
import EatingPlanDayForm from "./EatingPlanDayForm.jsx";
import PostAfterActions from "./PostAfterActions.jsx";
import WhatIAteMealBoard from "./WhatIAteMealBoard.jsx";
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

function LogFoodTrigger({ onClick, disabled }) {
  return (
    <button
      type="button"
      style={styles.logBtn}
      data-testid="eating-log-trigger"
      disabled={disabled}
      onClick={onClick}
      aria-label="Log food"
    >
      + Log
    </button>
  );
}

function PlansCalendarGlyph() {
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
  planPrefill = null,
  locationCity = null,
  locationState = null,
}) {
  void liked;
  void foodHref;

  const [composeOpenLocal, setComposeOpenLocal] = useState(false);
  const composeOpen = composeOpenProp ?? composeOpenLocal;
  const setComposeOpen = onComposeOpenChange ?? setComposeOpenLocal;
  const [calendarTitle, setCalendarTitle] = useState("Eating");
  const [composeDefaultMeal, setComposeDefaultMeal] = useState(defaultWhatIAteMealPeriod());

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
    setCalendarTitle("Upcoming Plans");
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
    onSelectedPlanKeyChange?.(event.key);
    onSchedulingPlansChange?.(false);
    const d = new Date(`${event.ymd}T12:00:00`);
    if (!Number.isNaN(d.getTime())) {
      onHubMonthChange?.(new Date(d.getFullYear(), d.getMonth(), 1));
    }
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
    setCalendarTitle("Upcoming Plans");
    onCalendarOpenChange(true);
  }

  function handleLogMeal(mealId) {
    setComposeDefaultMeal(mealId || defaultWhatIAteMealPeriod());
    setComposeOpen(true);
  }

  return (
    <section style={s.section} data-testid="eating" ref={sectionRef}>
      <SectionHead
        title="What I Ate"
        to={readOnly ? diaryHref : "/account/what-i-ate"}
        aside={
          <div style={styles.headAside}>
            {!readOnly ? (
              <LogFoodTrigger
                disabled={Boolean(postBusy)}
                onClick={() => {
                  setComposeDefaultMeal(defaultWhatIAteMealPeriod());
                  setComposeOpen(true);
                }}
              />
            ) : null}
            <DinerCalendarTrigger selectedDate={hubDate} onOpen={openEatingCalendar} />
          </div>
        }
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

      {wantListError ? <p style={s.error}>{wantListError}</p> : null}

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
          onSelect={readOnly ? undefined : onDiarySelect}
          onPhotoPick={readOnly ? undefined : onEatingPhotoPick}
          onLogMeal={readOnly || dateCmp > 0 ? undefined : handleLogMeal}
        />
        {!readOnly && dateCmp <= 0 && eatingForDay.length === 0 && lastPost?.kind !== "diary" ? (
          <p style={styles.emptyDay} data-testid="eating-ate-empty-day">
            Nothing logged for this day yet.{" "}
            <button type="button" style={styles.emptyLink} onClick={() => setComposeOpen(true)}>
              Log food
            </button>
          </p>
        ) : null}
      </div>

      <div data-testid="eating-want-panel" style={s.presentationBlock}>
        <SectionHead title="Want to Eat" />
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
          <p style={s.muted} data-testid="want-to-eat-empty">
            {readOnly ? "Nothing yet." : "Your wish list will show here."}
          </p>
        ) : null}
        <WantToEatList
          items={wants}
          readOnly={readOnly}
          layout="scroll"
          onSelectItem={readOnly ? undefined : onWantSelect}
          emptyMessage={null}
        />
      </div>

      <div data-testid="eating-plans-panel" style={{ ...s.presentationBlock, ...s.plansPanel }}>
        <SectionHead
          title="Upcoming Plans"
          aside={
            <button
              type="button"
              style={s.plansCalendarBtn}
              data-testid="upcoming-plans-calendar-open"
              aria-label="Open month calendar for upcoming plans"
              onClick={openPlansCalendar}
            >
              <PlansCalendarGlyph />
            </button>
          }
        />

        {shownPlans.length === 0 ? (
          <div style={s.plansEmpty} data-testid="future-plans-summary">
            <p style={s.plansEmptyText}>
              None scheduled
              {!readOnly ? (
                <>
                  {", "}
                  <Link to={inviteHref} style={s.plansEmptyLink}>
                    Invite Me
                  </Link>
                </>
              ) : null}
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

        {!readOnly && !schedulingPlans ? (
          <button
            type="button"
            style={styles.scheduleLink}
            onClick={() => {
              onSchedulingPlansChange?.(true);
              openPlansCalendar();
            }}
          >
            Schedule a plan
          </button>
        ) : null}
        {!readOnly && schedulingPlans ? (
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
        ) : null}
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
      </div>

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
          onClose={() => setComposeOpen(false)}
          defaultCategory={composeDefaultCategory}
          defaultMealPeriod={composeDefaultMeal}
          busy={postBusy === "eating" || postBusy === "want"}
          onSubmit={onComposeSubmit}
          onPlanSchedule={onPlanSchedule}
          followed={followed}
          locationCity={locationCity}
          locationState={locationState}
        />
      ) : null}

      {shownPlans.length > 0 || joinMeHref ? (
        <div style={{ ...s.labelRow, marginTop: 14 }}>
          {!readOnly ? (
            <Link to={inviteHref} style={s.subLabel}>
              Invite Me
            </Link>
          ) : null}
          {joinMeHref ? (
            <Link to={joinMeHref} style={s.subLabel}>
              Join Me
            </Link>
          ) : null}
        </div>
      ) : null}
      {!readOnly ? (
        <p style={{ ...s.muted, fontSize: 12 }}>
          Only people you open Join Me to can see that future plan.
        </p>
      ) : null}
    </section>
  );
}

const styles = {
  headAside: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  logBtn: {
    appearance: "none",
    border: "none",
    background: "linear-gradient(180deg, #22C55E 0%, #16A34A 100%)",
    color: "#0B0F0C",
    fontWeight: 800,
    fontSize: 13,
    padding: "6px 12px",
    borderRadius: 999,
    cursor: "pointer",
    fontFamily: "inherit",
    minHeight: 32,
    boxShadow: "0 2px 8px rgba(20, 83, 45, 0.2)",
  },
  emptyDay: {
    margin: "12px 0 0",
    fontSize: 14,
    color: "#64748b",
    lineHeight: 1.5,
  },
  emptyLink: {
    appearance: "none",
    border: "none",
    background: "transparent",
    color: "#15803d",
    fontWeight: 700,
    fontSize: 14,
    padding: 0,
    cursor: "pointer",
    fontFamily: "inherit",
    textDecoration: "underline",
  },
  scheduleLink: {
    appearance: "none",
    border: "none",
    background: "transparent",
    color: "#15803d",
    fontWeight: 700,
    fontSize: 14,
    padding: "8px 0 0",
    cursor: "pointer",
    fontFamily: "inherit",
    textDecoration: "underline",
  },
};
