import { Link } from "react-router-dom";
import * as s from "./monthInFoodStyles.js";

const ICONS = {
  fork: "🍽️",
  store: "🏪",
  camera: "📷",
  people: "👥",
  flame: "🔥",
};

export function MonthInFoodHero({ model, onPrev, onNext }) {
  return (
    <div style={s.heroGrid} data-testid="month-in-food-hero">
      <div>
        <h1 style={s.title}>My Month In Food</h1>
        <div style={s.monthPill}>
          <button type="button" style={s.monthNavBtn} onClick={onPrev} aria-label="Previous month">
            ‹
          </button>
          <span>{model.monthLabel}</span>
          <button type="button" style={s.monthNavBtn} onClick={onNext} aria-label="Next month">
            ›
          </button>
        </div>
        <p style={s.tagline}>{model.tagline}</p>
        {model.subject?.display_name ? (
          <p style={{ ...s.muted, marginTop: 8 }}>{model.subject.display_name}</p>
        ) : null}
      </div>
      <div style={s.heroMedia}>
        {model.heroImage ? (
          <img src={model.heroImage} alt="" style={s.heroImg} />
        ) : (
          <div style={{ ...s.heroImg, minHeight: 200 }} aria-hidden />
        )}
        <div style={s.heroBadge}>
          <span>
            Food is <em>better</em> together.
          </span>
          <span aria-hidden style={{ marginTop: 6, color: "#86efac" }}>
            ♥
          </span>
        </div>
      </div>
    </div>
  );
}

export function MonthInFoodStatsBar({ stats = [] }) {
  if (!stats.length) return null;
  return (
    <div style={s.statsBar} data-testid="month-in-food-stats">
      {stats.map((stat) => (
        <div key={stat.id} style={s.statCell}>
          <div aria-hidden style={{ fontSize: 16 }}>
            {ICONS[stat.icon] || "•"}
          </div>
          <div style={s.statValue}>{stat.value}</div>
          <div style={s.statLabel}>{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

export function MonthInFoodHighlights({ highlights = [] }) {
  if (!highlights.length) return null;
  const [main, ...rest] = highlights;
  return (
    <section style={s.card} data-testid="month-in-food-highlights">
      <div style={s.sectionHead}>
        <h2 style={s.sectionTitle}>Top Highlights</h2>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: rest.length ? "1.4fr 1fr" : "1fr", gap: 10 }}>
        <HighlightCard card={main} large />
        {rest.length ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {rest.map((card) => (
              <HighlightCard key={card.key} card={card} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function HighlightCard({ card, large = false }) {
  const body = (
    <div
      style={{
        position: "relative",
        borderRadius: 14,
        overflow: "hidden",
        minHeight: large ? 180 : 88,
        background: "#e7e5e4",
        flex: 1,
      }}
    >
      {card.image ? (
        <img
          src={card.image}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          padding: "10px 12px",
          background: "linear-gradient(transparent, rgba(0,0,0,0.72))",
          color: "#fff",
        }}
      >
        <div style={{ fontWeight: 800, fontSize: large ? 16 : 13 }}>{card.label}</div>
        {card.sublabel ? <div style={{ fontSize: 12, opacity: 0.9 }}>{card.sublabel}</div> : null}
      </div>
    </div>
  );
  if (card.href) {
    return (
      <Link to={card.href} style={{ textDecoration: "none", color: "inherit", display: "flex" }}>
        {body}
      </Link>
    );
  }
  return body;
}

export function MonthInFoodVisited({ visited = [] }) {
  if (!visited.length) return null;
  return (
    <section style={s.card} data-testid="month-in-food-visited">
      <div style={s.sectionHead}>
        <h2 style={s.sectionTitle}>Restaurants I Visited</h2>
      </div>
      <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4 }}>
        {visited.map((r) => (
          <div key={r.restaurant_id} style={{ width: 96, flex: "0 0 auto", textAlign: "center" }}>
            <div
              style={{
                width: 84,
                height: 84,
                borderRadius: 16,
                overflow: "hidden",
                margin: "0 auto 6px",
                background: "#e7e5e4",
              }}
            >
              {r.image ? (
                <img src={r.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : null}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.2 }}>{r.name}</div>
            {r.place ? <div style={{ fontSize: 11, color: s.MUTED }}>{r.place}</div> : null}
          </div>
        ))}
      </div>
    </section>
  );
}

export function MonthInFoodMoments({ moments = [], overflow = 0 }) {
  if (!moments.length) return null;
  return (
    <section style={s.card} data-testid="month-in-food-moments">
      <div style={s.sectionHead}>
        <h2 style={s.sectionTitle}>Moments To Remember</h2>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {moments.map((m, idx) => (
          <div
            key={m.key}
            style={{
              position: "relative",
              aspectRatio: "1",
              borderRadius: 12,
              overflow: "hidden",
              background: "#e7e5e4",
            }}
          >
            <img src={m.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            {idx === moments.length - 1 && overflow > 0 ? (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(20,83,45,0.72)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: 22,
                }}
              >
                +{overflow}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

export function MonthInFoodMood({ mood }) {
  if (!mood) return null;
  return (
    <section style={{ ...s.card, background: s.FOREST, color: "#fff" }} data-testid="month-in-food-mood">
      <div style={{ fontSize: 12, opacity: 0.8, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
        My Food Mood This Month
      </div>
      <div style={{ fontSize: 28, fontFamily: 'Georgia, "Times New Roman", serif', margin: "6px 0 12px" }}>
        {mood.label}
      </div>
      <div style={{ display: "grid", gap: 8, fontSize: 14 }}>
        {mood.mostLogged ? (
          <div>
            <strong>Most Logged:</strong> {mood.mostLogged}
          </div>
        ) : null}
        {mood.drinkOfChoice ? (
          <div>
            <strong>Drink of Choice:</strong> {mood.drinkOfChoice}
          </div>
        ) : null}
        {mood.goToSpot ? (
          <div>
            <strong>Go-To Spot:</strong> {mood.goToSpot}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function MonthInFoodByTheNumbers({ totalMeals, cuisineSlices = [], miniStats = [] }) {
  if (!cuisineSlices.length && !miniStats.length && !totalMeals) return null;
  const colors = s.CUISINE_COLORS;
  let gradient = "conic-gradient(#d6d3d1 0 100%)";
  if (cuisineSlices.length) {
    let acc = 0;
    const stops = cuisineSlices.map((slice, i) => {
      const start = acc;
      acc += slice.pct;
      return `${colors[i % colors.length]} ${start}% ${acc}%`;
    });
    if (acc < 100) stops.push(`#d6d3d1 ${acc}% 100%`);
    gradient = `conic-gradient(${stops.join(", ")})`;
  }

  return (
    <section style={s.card} data-testid="month-in-food-numbers">
      <div style={s.sectionHead}>
        <h2 style={s.sectionTitle}>By The Numbers</h2>
      </div>
      {cuisineSlices.length ? (
        <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <div
            style={{
              width: 140,
              height: 140,
              borderRadius: "50%",
              background: gradient,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <div
              style={{
                width: 88,
                height: 88,
                borderRadius: "50%",
                background: "#fff",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                padding: 8,
              }}
            >
              <strong style={{ fontSize: 20, color: s.FOREST }}>{totalMeals}</strong>
              <span style={{ fontSize: 11, color: s.MUTED }}>Total Meals</span>
            </div>
          </div>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, flex: 1, minWidth: 140 }}>
            {cuisineSlices.map((slice, i) => (
              <li key={slice.name} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, fontSize: 13 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    background: colors[i % colors.length],
                    flex: "0 0 auto",
                  }}
                />
                <span style={{ flex: 1 }}>{slice.name}</span>
                <strong>{slice.pct}%</strong>
              </li>
            ))}
          </ul>
        </div>
      ) : totalMeals > 0 ? (
        <p style={s.muted}>{totalMeals} meals logged this month.</p>
      ) : null}
      {miniStats.length ? (
        <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
          {miniStats.map((m) => (
            <div
              key={m.id}
              style={{
                flex: "1 1 90px",
                background: s.CREAM,
                borderRadius: 12,
                padding: "10px 12px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 20, fontWeight: 800, color: s.FOREST }}>{m.value}</div>
              <div style={{ fontSize: 11, color: s.MUTED, fontWeight: 600 }}>{m.label}</div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export function MonthInFoodWants({ wants = [] }) {
  if (!wants.length) return null;
  return (
    <section style={s.card} data-testid="month-in-food-wants">
      <div style={s.sectionHead}>
        <h2 style={s.sectionTitle}>What I Want To Eat</h2>
        <Link to="/my-menuply?compose=want" style={s.viewAll}>
          View all
        </Link>
      </div>
      <div style={{ display: "flex", gap: 10, overflowX: "auto" }}>
        {wants.map((w) => (
          <div key={w.key} style={{ width: 110, flex: "0 0 auto" }}>
            <div
              style={{
                width: 110,
                height: 88,
                borderRadius: 12,
                overflow: "hidden",
                background: "#e7e5e4",
                marginBottom: 6,
              }}
            >
              {w.photo_url ? (
                <img src={w.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : null}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700 }}>{w.food_name}</div>
            {w.restaurant_name ? <div style={{ fontSize: 11, color: s.MUTED }}>{w.restaurant_name}</div> : null}
          </div>
        ))}
      </div>
    </section>
  );
}

export function MonthInFoodPlansEvents({ plans = [], events = [] }) {
  if (!plans.length && !events.length) return null;
  const plan = plans[0];
  return (
    <section style={s.card} data-testid="month-in-food-plans-events">
      <div style={s.sectionHead}>
        <h2 style={s.sectionTitle}>Connections & Events</h2>
      </div>
      {plan ? (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: s.MUTED, marginBottom: 6 }}>Upcoming Plans</div>
          <div
            style={{
              display: "flex",
              gap: 12,
              background: s.CREAM,
              borderRadius: 14,
              padding: 12,
              alignItems: "center",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800 }}>{plan.title || plan.restaurant_name || "Plan"}</div>
              <div style={{ fontSize: 12, color: s.MUTED }}>{plan.plan_date}</div>
              {plan.participant_count > 1 ? (
                <div style={{ fontSize: 12, marginTop: 4 }}>{plan.participant_count} going</div>
              ) : null}
              {plan.href ? (
                <Link to={plan.href} style={{ ...s.viewAll, display: "inline-block", marginTop: 8 }}>
                  Open plan
                </Link>
              ) : null}
            </div>
            {plan.restaurant_logo_url ? (
              <img
                src={plan.restaurant_logo_url}
                alt=""
                style={{ width: 72, height: 72, borderRadius: 12, objectFit: "cover" }}
              />
            ) : null}
          </div>
        </div>
      ) : null}
      {events.length ? (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: s.MUTED, marginBottom: 6 }}>Events I&apos;m Excited For</div>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {events.map((ev) => (
              <li
                key={ev.id}
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  padding: "10px 0",
                  borderTop: `1px solid ${s.BORDER}`,
                }}
              >
                <div
                  style={{
                    background: s.FOREST,
                    color: "#fff",
                    borderRadius: 10,
                    padding: "6px 8px",
                    fontSize: 11,
                    fontWeight: 800,
                    textAlign: "center",
                    minWidth: 48,
                  }}
                >
                  {(ev.event_date || "").slice(5) || "Soon"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{ev.title}</div>
                </div>
                {ev.href ? (
                  <Link to={ev.href} style={s.viewAll}>
                    View
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
