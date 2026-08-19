/**
 * Unified Eating hub — compose, filter, feed, single tap-to-open calendar.
 */

import { Link } from "react-router-dom";
import DinerCalendarSheet, { DinerCalendarTrigger } from "./DinerCalendarSheet.jsx";
import EatingCompose from "./EatingCompose.jsx";
import EatingPlanDayForm from "./EatingPlanDayForm.jsx";
import PostAfterActions from "./PostAfterActions.jsx";
import {
  PhotoGrid,
  SectionHead,
  FuturePlanRow,
  WantToEatList,
} from "./myMenuplyBits.jsx";
import { formatPlanBracketDate, futurePlanKey } from "./dinerHubFormat.js";
import { compareYmd, EATING_FILTERS, planYmd } from "./eatingHubUtils.js";
import { defaultWhatIAteMealPeriod } from "../../../lib/whatIAteTodayMealPeriod.js";
import { whatIAteTodayLocalDate } from "../../../lib/consumerApi.js";
import * as s from "./myMenuplyStyles.js";

function FilterChips({ value, onChange, readOnly }) {
  if (readOnly) return null;
  return (
    <div style={styles.filters} data-testid="eating-filters">
      {EATING_FILTERS.map((chip) => {
        const active = chip.id === value;
        return (
          <button
            key={chip.id}
            type="button"
            data-testid={`eating-filter-${chip.id}`}
            style={{ ...styles.filterChip, ...(active ? styles.filterChipActive : null) }}
            onClick={() => onChange(chip.id)}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
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
  eatingFilter = "all",
  onEatingFilterChange,
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
  foodHref,
  sectionRef = null,
}) {
  const today = whatIAteTodayLocalDate();
  const dateCmp = compareYmd(hubDate, today);
  const showAte = !readOnly
    ? eatingFilter === "all" || eatingFilter === "ate"
    : true;
  const showWant = eatingFilter === "all" || eatingFilter === "want";
  const showPlans = eatingFilter === "all" || eatingFilter === "plans";

  const eatingForDay = eating.filter((row) => planYmd(row.eaten_on || row.created_at) === hubDate);
  const plansForDay = shownPlans.filter((plan) => planYmd(plan.plan_date) === hubDate);
  const plansToShow =
    eatingFilter === "plans" && dateCmp >= 0 ? plansForDay : showPlans ? shownPlans : [];

  function handleCalendarDate(ymd) {
    onHubDateChange(ymd);
    const cmp = compareYmd(ymd, today);
    if (cmp > 0) {
      onEatingFilterChange?.("plans");
      onSchedulingPlansChange?.(true);
      const match = scheduledPlans.find((plan) => planYmd(plan.plan_date) === ymd);
      if (match) onSelectedPlanKeyChange?.(futurePlanKey(match));
    } else if (cmp <= 0) {
      onEatingFilterChange?.(eatingFilter === "plans" ? "ate" : eatingFilter);
    }
  }

  function handleCalendarEvent(event) {
    onHubDateChange(event.ymd);
    onSelectedPlanKeyChange?.(event.key);
    onSchedulingPlansChange?.(false);
    onEatingFilterChange?.("plans");
  }

  return (
    <section style={s.section} data-testid="eating" ref={sectionRef}>
      <SectionHead
        title="Eating"
        to={readOnly ? diaryHref : "/account/what-i-ate"}
        aside={
          <DinerCalendarTrigger
            selectedDate={hubDate}
            onOpen={() => onCalendarOpenChange(true)}
          />
        }
      />

      {!readOnly ? (
        <>
          <EatingCompose
            busy={postBusy === "eating" || postBusy === "want"}
            onSubmit={onComposeSubmit}
            onPlanSchedule={onPlanSchedule}
          />
          <FilterChips value={eatingFilter} onChange={onEatingFilterChange} />
        </>
      ) : null}

      {wantListError ? <p style={s.error}>{wantListError}</p> : null}

      {showAte ? (
        <div data-testid="eating-ate-panel">
          {!readOnly && dateCmp <= 0 ? (
            <p style={{ ...s.muted, margin: "0 0 8px", fontSize: 13 }}>
              {hubDate === today ? "Today" : formatPlanBracketDate(hubDate)}
            </p>
          ) : null}
          <PhotoGrid
            items={
              readOnly
                ? eatingForDay.length
                  ? eatingForDay
                  : eating.slice(0, 12)
                : eatingForDay.length
                  ? eatingForDay
                  : dateCmp <= 0
                    ? [
                        {
                          id: "placeholder",
                          food_name: "Food",
                          eaten_on: hubDate,
                          meal_period: defaultWhatIAteMealPeriod(),
                          kind: "what_i_ate",
                        },
                      ]
                    : []
            }
            hideJoinMe
            onPhotoPick={readOnly ? undefined : onEatingPhotoPick}
            onSelect={readOnly ? undefined : onDiarySelect}
          />
          {lastPost?.kind === "diary" ? (
            <PostAfterActions
              kind="diary"
              record={lastPost}
              busy={postBusy === "eating"}
              followed={followed}
              onTagged={onPostTagged}
            />
          ) : null}
        </div>
      ) : null}

      {showWant ? (
        <div data-testid="eating-want-panel" style={{ marginTop: showAte ? 12 : 0 }}>
          {!readOnly ? (
            <p style={{ ...s.muted, margin: "0 0 8px", fontSize: 13 }}>Want to try</p>
          ) : (
            <SectionHead title="Want to try" />
          )}
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
              {readOnly ? "Nothing yet." : "Nothing on your want list yet."}
            </p>
          ) : null}
          <WantToEatList
            items={wants}
            readOnly={readOnly}
            onSelectItem={readOnly ? undefined : onWantSelect}
            emptyMessage={null}
          />
          {!readOnly
            ? liked.slice(0, 6).map((meal) => (
                <Link key={meal.menu_item_id} to={foodHref(meal)} style={s.card}>
                  <div style={{ fontWeight: 800 }}>{meal.item_name}</div>
                  <div style={s.muted}>{meal.restaurant_name}</div>
                </Link>
              ))
            : null}
        </div>
      ) : null}

      {showPlans ? (
        <div data-testid="eating-plans-panel" style={{ marginTop: 12 }}>
          <p style={{ ...s.muted, margin: "0 0 8px", fontSize: 13 }}>Future plans</p>
          {plansToShow.length === 0 ? (
            <p style={s.muted} data-testid="future-plans-summary">
              No plans scheduled.
            </p>
          ) : (
            plansToShow.map((plan) => {
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
              style={{ ...s.chipBtn, width: "100%", justifyContent: "center", marginTop: 8, minHeight: 44 }}
              onClick={() => {
                onSchedulingPlansChange?.(true);
                onCalendarOpenChange(true);
                onEatingFilterChange?.("plans");
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
      ) : null}

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
        events={calendarEvents}
      />

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
        <p style={s.muted}>Only people you open Join Me to can see that future plan.</p>
      ) : null}
    </section>
  );
}

const styles = {
  filters: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    margin: "0 0 12px",
  },
  filterChip: {
    appearance: "none",
    border: "1px solid rgba(60,60,67,0.15)",
    background: "#fff",
    color: "#48484A",
    borderRadius: 999,
    padding: "5px 12px",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  filterChipActive: {
    background: "#F2F2F7",
    borderColor: "#C7C7CC",
    color: "#1C1C1E",
  },
};
