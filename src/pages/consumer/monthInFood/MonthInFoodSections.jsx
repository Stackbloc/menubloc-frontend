import { Link } from "react-router-dom";
import ShareButton from "../../../components/share/ShareButton.jsx";
import { MY_MENUPLY_PROFILE_PATH, myMenuplyProfileHref } from "../../../lib/myMenuplyRoutes.js";
import * as s from "./monthInFoodStyles.js";

export function MonthInFoodHero({ model, onPrev, onNext, shareData = null }) {
  const collage = Array.isArray(model.heroCollage) ? model.heroCollage : [];
  const showCollage = collage.length >= 2;

  return (
    <header style={{ ...s.sectionGap }} data-testid="month-in-food-hero">
      <div style={s.monthPill}>
        <button type="button" style={s.monthNavBtn} onClick={onPrev} aria-label="Previous month">
          ‹
        </button>
        <span>{model.monthLabel}</span>
        <button type="button" style={s.monthNavBtn} onClick={onNext} aria-label="Next month">
          ›
        </button>
      </div>

      <div style={{ ...s.titleRow, marginTop: 18 }}>
        <h1 style={{ ...s.title, margin: 0 }}>
          My month in <em style={{ fontStyle: "italic", color: "var(--mif-amber, #DE9E33)" }}>food</em>.
        </h1>
        {shareData ? (
          <span data-testid="month-in-food-title-share">
            <ShareButton
              shareData={shareData}
              iconOnly
              size="compact"
              tone="ghost"
              label="Share"
              modalTitle="Share Month in Food"
              analyticsContext={{ surface: "month_in_food", path: shareData?.url || null }}
            />
          </span>
        ) : null}
      </div>

      <p style={s.tagline}>{model.tagline}</p>
      {model.subject?.display_name ? (
        <p style={s.byline}>
          Recapped by <strong style={{ color: "var(--mif-ink, #231F19)" }}>{model.subject.display_name}</strong>
        </p>
      ) : null}

      {showCollage ? (
        <div
          data-testid="month-in-food-hero-collage"
          style={{
            position: "relative",
            marginTop: 28,
            height: 280,
            maxHeight: 300,
            width: "100%",
            maxWidth: "100%",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "4%",
              top: 18,
              width: "48%",
              maxWidth: 240,
              aspectRatio: "4 / 5",
              transform: "rotate(-3.5deg)",
              background: "var(--mif-paper, #FFFDF8)",
              padding: 6,
              borderRadius: 4,
              boxShadow: "0 12px 28px rgba(35,31,25,0.16)",
              boxSizing: "border-box",
            }}
          >
            <img
              src={collage[0].url}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", borderRadius: 2 }}
            />
          </div>
          <div
            style={{
              position: "absolute",
              right: "2%",
              top: 8,
              width: "48%",
              maxWidth: 240,
              aspectRatio: "4 / 5",
              transform: "rotate(3deg)",
              background: "var(--mif-paper, #FFFDF8)",
              padding: 6,
              borderRadius: 4,
              boxShadow: "0 12px 28px rgba(35,31,25,0.16)",
              boxSizing: "border-box",
            }}
          >
            <img
              src={collage[1].url}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", borderRadius: 2 }}
            />
          </div>
          <div
            style={{
              position: "absolute",
              right: 8,
              bottom: 8,
              background: "var(--mif-forest, #16302A)",
              color: "#fff",
              borderRadius: 999,
              padding: "8px 14px",
              fontSize: 13,
              fontWeight: 600,
              fontFamily: s.FONT_BODY,
              zIndex: 2,
            }}
            data-testid="month-in-food-meals-badge"
          >
            {model.mealsLogged} meals logged
          </div>
        </div>
      ) : null}
    </header>
  );
}

export function MonthInFoodStatsBar({ stats = [] }) {
  if (!stats.length) return null;
  return (
    <section style={{ ...s.sectionGap }} data-testid="month-in-food-stats">
      <h2 style={{ ...s.sectionTitle, marginBottom: 14 }}>By the numbers</h2>
      <div style={s.statsGrid}>
        {stats.map((stat, idx) => {
          const col = idx % 3;
          const row = Math.floor(idx / 3);
          return (
            <div
              key={stat.id}
              style={{
                ...s.statCell,
                borderRight: col === 2 ? "none" : s.statCell.borderRight,
                borderBottom: row === 1 ? "none" : s.statCell.borderBottom,
              }}
            >
              <div style={s.statValue}>{stat.value}</div>
              <div style={s.statLabel}>{stat.label}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function MonthInFoodVisited({ visited = [] }) {
  if (!visited.length) return null;
  return (
    <section style={{ ...s.sectionGap }} data-testid="month-in-food-visited">
      <div style={s.sectionHead}>
        <h2 style={s.sectionTitle}>Restaurants I visited</h2>
        <Link to={MY_MENUPLY_PROFILE_PATH} style={s.viewAll}>
          See all
        </Link>
      </div>
      <div style={s.hScrollRail}>
        {visited.map((r) => (
          <div key={r.restaurant_id} style={{ width: 88, flex: "0 0 auto", textAlign: "center" }}>
            <div
              aria-hidden
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                margin: "0 auto 8px",
                background: r.monogramColor || s.FOREST,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: s.FONT_DISPLAY,
                fontSize: 28,
                fontWeight: 600,
              }}
            >
              {r.monogram || "?"}
            </div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                lineHeight: 1.25,
                color: "var(--mif-ink, #231F19)",
              }}
            >
              {r.name}
            </div>
            {r.place ? (
              <div style={{ fontSize: 11, color: "var(--mif-ink-soft, #5B5548)", marginTop: 2 }}>{r.place}</div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

export function MonthInFoodHomeMeals({ homeMeals = [] }) {
  if (!homeMeals.length) return null;
  return (
    <section style={{ ...s.card, ...s.sectionGap }} data-testid="month-in-food-home">
      <div style={s.sectionHead}>
        <h2 style={{ ...s.sectionTitle, margin: 0 }}>@home meals</h2>
        <Link to={myMenuplyProfileHref({ compose: "ate" })} style={s.viewAll}>
          Log meal
        </Link>
      </div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {homeMeals.map((m) => {
          const meta = [m.meal_period, m.eaten_on_label || m.eaten_on].filter(Boolean).join(" · ");
          const row = (
            <div
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                padding: "12px 0",
                borderTop: "1px solid var(--mif-hairline, #DDD3BE)",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{m.food_name}</div>
                {meta ? (
                  <div style={{ fontSize: 12, color: "var(--mif-ink-soft, #5B5548)", marginTop: 2 }}>{meta}</div>
                ) : null}
              </div>
            </div>
          );
          return (
            <li key={m.key}>
              {m.href ? (
                <Link to={m.href} style={{ color: "inherit", textDecoration: "none" }}>
                  {row}
                </Link>
              ) : (
                row
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function MonthInFoodMood({ mood }) {
  if (!mood) return null;
  const facts = [
    mood.mostLogged ? { label: "Most logged", value: mood.mostLogged } : null,
    mood.drinkOfChoice ? { label: "Drink of choice", value: mood.drinkOfChoice } : null,
    mood.goToSpot ? { label: "Go-to spot", value: mood.goToSpot } : null,
  ].filter(Boolean);

  return (
    <section
      style={{
        ...s.card,
        ...s.sectionGap,
        background: "var(--mif-forest, #16302A)",
        color: "#fff",
        border: "none",
      }}
      data-testid="month-in-food-mood"
    >
      <div style={{ fontSize: 13, opacity: 0.8, fontWeight: 500 }}>My food mood this month</div>
      {mood.label ? (
        <div
          style={{
            fontSize: "clamp(32px, 8vw, 42px)",
            fontFamily: s.FONT_DISPLAY,
            fontStyle: "italic",
            color: "var(--mif-amber, #DE9E33)",
            margin: "8px 0 18px",
            lineHeight: 1.1,
          }}
        >
          {mood.label}
        </div>
      ) : (
        <div style={{ height: 12 }} />
      )}
      {facts.length ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 14,
            fontSize: 14,
          }}
        >
          {facts.map((f) => (
            <div key={f.label}>
              <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 2 }}>{f.label}</div>
              <div style={{ fontWeight: 600 }}>{f.value}</div>
            </div>
          ))}
        </div>
      ) : null}
      {mood.restaurantSpend ? (
        <div
          style={{
            marginTop: 16,
            paddingTop: 14,
            borderTop: "1px solid rgba(255,255,255,0.22)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            gap: 12,
          }}
          data-testid="month-in-food-restaurant-spend"
        >
          <span style={{ fontSize: 13, opacity: 0.8 }}>Restaurant spend</span>
          <span
            style={{
              fontFamily: s.FONT_DISPLAY,
              fontSize: 22,
              fontWeight: 600,
              color: "var(--mif-amber, #DE9E33)",
            }}
          >
            {mood.restaurantSpend}
          </span>
        </div>
      ) : null}
    </section>
  );
}

export function MonthInFoodMoments({ moments = [], overflow = 0 }) {
  if (!moments.length) return null;
  return (
    <section style={{ ...s.sectionGap }} data-testid="month-in-food-moments">
      <div style={s.sectionHead}>
        <h2 style={s.sectionTitle}>Moments to remember</h2>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
        {moments.map((m, idx) => (
          <figure key={m.key} style={{ margin: 0 }}>
            <div
              style={{
                position: "relative",
                aspectRatio: "1",
                borderRadius: 12,
                overflow: "hidden",
                background: "var(--mif-hairline, #DDD3BE)",
                border: "4px solid var(--mif-paper, #FFFDF8)",
                boxShadow: "0 6px 18px rgba(35,31,25,0.1)",
                boxSizing: "border-box",
              }}
            >
              <img src={m.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              {idx === moments.length - 1 && overflow > 0 ? (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(22,48,42,0.72)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: s.FONT_DISPLAY,
                    fontWeight: 600,
                    fontSize: 22,
                  }}
                >
                  +{overflow}
                </div>
              ) : null}
            </div>
            {m.caption ? (
              <figcaption
                style={{
                  marginTop: 6,
                  fontSize: 12,
                  color: "var(--mif-ink-soft, #5B5548)",
                  lineHeight: 1.3,
                }}
              >
                {m.caption}
              </figcaption>
            ) : null}
          </figure>
        ))}
      </div>
    </section>
  );
}

export function MonthInFoodCravingsPlans({
  wants = [],
  takeMeOutOpen = false,
  isSelf = false,
  plans = [],
  events = [],
  crewsJoinDefault = false,
}) {
  const spots = wants.slice(0, 2);
  const showCravings = spots.length > 0 || isSelf;
  const showPlans = plans.length > 0 || events.length > 0 || (isSelf && crewsJoinDefault);
  if (!showCravings && !showPlans) return null;

  return (
    <section
      style={{
        ...s.sectionGap,
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: 12,
      }}
      className="month-in-food-two-up"
      data-testid="month-in-food-cravings-plans"
    >
      {showCravings ? (
        <div style={s.card} data-testid="month-in-food-wants">
          <div style={{ fontSize: 12, color: "var(--mif-ink-soft, #5B5548)", marginBottom: 4 }}>Cravings</div>
          <h3 style={{ ...s.sectionTitle, fontSize: 18, margin: 0 }}>What I wanna eat</h3>
          {isSelf ? (
            <p
              style={{ margin: "8px 0 0", fontSize: 12, color: "var(--mif-ink-soft, #5B5548)" }}
              data-testid="month-in-food-take-me-out-status"
            >
              Take Me Out is {takeMeOutOpen ? "On" : "Off"}
            </p>
          ) : null}
          <ul style={{ listStyle: "none", margin: "12px 0 0", padding: 0 }}>
            {spots.map((w) => (
              <li key={w.key} style={{ padding: "8px 0", borderTop: "1px solid var(--mif-hairline, #DDD3BE)" }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{w.food_name}</div>
                {w.restaurant_name ? (
                  <div style={{ fontSize: 12, color: "var(--mif-ink-soft, #5B5548)" }}>{w.restaurant_name}</div>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div />
      )}

      {showPlans ? (
        <div style={s.card} data-testid="month-in-food-plans-events">
          <h3 style={{ ...s.sectionTitle, fontSize: 18, margin: 0 }}>Plans &amp; events</h3>
          {isSelf ? (
            <p
              style={{ margin: "8px 0 0", fontSize: 12, color: "var(--mif-ink-soft, #5B5548)" }}
              data-testid="month-in-food-join-me-defaults"
            >
              {crewsJoinDefault
                ? "Join Crew default: On · Join Me is set on each plan and event"
                : "Join Me is set on each plan and event"}
            </p>
          ) : null}
          <ul style={{ listStyle: "none", margin: "12px 0 0", padding: 0 }}>
            {plans.slice(0, 2).map((plan) => (
              <li key={`p-${plan.id}`} style={{ padding: "10px 0", borderTop: "1px solid var(--mif-hairline, #DDD3BE)" }}>
                <div
                  style={{
                    fontFamily: s.FONT_DISPLAY,
                    color: "var(--mif-clay, #B6472F)",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  {plan.plan_date || "Soon"}
                </div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{plan.title || plan.restaurant_name || "Plan"}</div>
                <div style={{ fontSize: 12, color: "var(--mif-ink-soft, #5B5548)", marginTop: 2 }}>
                  {plan.joinable ? "Join Me is open" : "Just me"}
                </div>
              </li>
            ))}
            {events.slice(0, 2).map((ev) => (
              <li
                key={`${ev.kind || "event"}-${ev.id}`}
                style={{ padding: "10px 0", borderTop: "1px solid var(--mif-hairline, #DDD3BE)" }}
              >
                <div
                  style={{
                    fontFamily: s.FONT_DISPLAY,
                    color: "var(--mif-clay, #B6472F)",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  {ev.event_date || "Soon"}
                </div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{ev.title}</div>
                {ev.kind === "diner_social" && ev.join_me_open ? (
                  <div style={{ fontSize: 12, color: "var(--mif-ink-soft, #5B5548)", marginTop: 2 }}>
                    Join Me is open
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

/** Donut sidebar removed in redesign. */
export function MonthInFoodByTheNumbers() {
  return null;
}

export function MonthInFoodWants(props) {
  return <MonthInFoodCravingsPlans {...props} />;
}

export function MonthInFoodPlansEvents() {
  return null;
}
