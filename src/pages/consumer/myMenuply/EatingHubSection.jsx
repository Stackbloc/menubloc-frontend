/**
 * Unified Eating hub — presentation feed + on-demand compose sheet (input separated).
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import DinerCalendarSheet, { DinerCalendarTrigger } from "./DinerCalendarSheet.jsx";
import EatingComposeSheet from "./EatingComposeSheet.jsx";
import EatingPlanDayForm from "./EatingPlanDayForm.jsx";
import PostAfterActions from "./PostAfterActions.jsx";
import {
  PhotoGrid,
  SectionHead,
  FuturePlanRow,
  WantToEatList,
} from "./myMenuplyBits.jsx";
import { formatPlanBracketDate, futurePlanKey } from "./dinerHubFormat.js";
import {
  clampEatingLookbackDate,
  compareYmd,
  eatingHistoryStart,
  planYmd,
  shiftYmd,
} from "./eatingHubUtils.js";
import { whatIAteTodayLocalDate } from "../../../lib/consumerApi.js";
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
}) {
  const [composeOpenLocal, setComposeOpenLocal] = useState(false);
  const composeOpen = composeOpenProp ?? composeOpenLocal;
  const setComposeOpen = onComposeOpenChange ?? setComposeOpenLocal;

  const today = whatIAteTodayLocalDate();
  const lookbackStart = eatingHistoryStart(today);
  const dateCmp = compareYmd(hubDate, today);
  const canGoBack = compareYmd(hubDate, lookbackStart) > 0;
  const canGoForward = true;

  const eatingForDay = eating.filter((row) => {
    if (planYmd(row.eaten_on || row.created_at) === hubDate) return true;
    if (lastPost?.kind === "diary" && Number(row.entry_id) === Number(lastPost.id)) return true;
    return false;
  });
  const presentationEating = readOnly
    ? eatingForDay.length
      ? eatingForDay
      : eating.slice(0, 12)
    : eatingForDay.length
      ? eatingForDay
      : eating.slice(0, 6);

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
  }

  function goDay(delta) {
    const next = shiftYmd(hubDate, delta, today);
    handleCalendarDate(next);
  }

  function handleCalendarEvent(event) {
    onHubDateChange(event.ymd);
    onSelectedPlanKeyChange?.(event.key);
    onSchedulingPlansChange?.(false);
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
                onClick={() => setComposeOpen(true)}
              />
            ) : null}
            <DinerCalendarTrigger
              selectedDate={hubDate}
              onOpen={() => onCalendarOpenChange(true)}
            />
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
            onTagged={onPostTagged}
            onSkip={onSkipDetails}
          />
        ) : null}
        <PhotoGrid
          items={presentationEating}
          presentation
          hideJoinMe
          onPhotoPick={readOnly ? undefined : onEatingPhotoPick}
          onSelect={readOnly ? undefined : onDiarySelect}
        />
        {!readOnly && dateCmp <= 0 && presentationEating.length === 0 && lastPost?.kind !== "diary" ? (
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
            <div style={{ ...s.muted, fontSize: 12, marginTop: 4 }}>Saved — link a menu item below</div>
          </div>
        ) : null}
        {lastPost?.kind === "want" && !readOnly ? (
          <PostAfterActions
            kind="want"
            record={lastPost}
            busy={postBusy === "want"}
            followed={followed}
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

      <div data-testid="eating-plans-panel" style={s.presentationBlock}>
        <SectionHead title="Upcoming Plans" />
        {shownPlans.length === 0 ? (
          <p style={s.muted} data-testid="future-plans-summary">
            No plans scheduled.
          </p>
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
              onCalendarOpenChange(true);
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
            onSubmit={onPostPlan}
          />
        ) : null}
        {lastPost?.kind === "plan" && !readOnly ? (
          <PostAfterActions
            kind="plan"
            record={lastPost}
            busy={postBusy === "eating"}
            followed={followed}
            onTagged={onPostTagged}
          />
        ) : null}
      </div>

      <DinerCalendarSheet
        open={calendarOpen}
        onClose={() => onCalendarOpenChange(false)}
        testId="eating-calendar"
        title="Eating"
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
          busy={postBusy === "eating" || postBusy === "want"}
          onSubmit={onComposeSubmit}
          onPlanSchedule={onPlanSchedule}
          followed={followed}
        />
      ) : null}

      <div style={{ ...s.labelRow, marginTop: 14 }}>
        <Link to={inviteHref} style={s.subLabel}>
          Invite Me
        </Link>
        {joinMeHref ? (
          <Link to={joinMeHref} style={s.subLabel}>
            Join Me
          </Link>
        ) : null}
      </div>
      {!readOnly ? (
        <p style={{ ...s.muted, fontSize: 12 }}>Only people you open Join Me to can see that future plan.</p>
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
