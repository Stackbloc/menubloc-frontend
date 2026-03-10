/**
 * ============================================================
 * Path: menubloc-frontend/src/components/InsightsRolodex.jsx
 * Purpose:
 *   Grubbid's 7-card Rolodex-style intelligence module.
 *   Accepts a partial or full intelligence payload derived from existing item data.
 *   Cards with missing data display "Insufficient data" gracefully.
 *
 *   Cards (in order):
 *     1. What It Is       — dish identity, cuisine, prep method
 *     2. Body Impact      — glycemic, energy, sugar, sodium scores
 *     3. Goal Alignment   — diet flags as match/no-match chips
 *     4. Sensitivities    — allergens, gluten, dairy
 *     5. Nutrition Density— whole food / processing scores + macro estimates
 *     6. After-Effects    — satiety, energy duration, fat balance
 *     7. Frequency        — how often to enjoy, derived from composite
 *
 *   Props:
 *     data       {object}  — intelligence payload from the API
 *     compact    {boolean} — true = search card mode (no bullets, fixed height)
 *     itemName   {string}  — menu item name for fallback display
 * ============================================================
 */

import { useState, useRef } from "react";

const CARD_COUNT = 7;
const PEEK_FULL    = 22; // px of adjacent card visible in full mode
const PEEK_COMPACT = 14; // px in compact mode

/* ---- Card color palette (colored left stripe per card) ---- */
const CARD_ACCENT = [
  "#1447a8", // 1: What It Is       — blue
  "#c45c0a", // 2: Body Impact      — orange
  "#1a7a3a", // 3: Goal Alignment   — green
  "#9a6200", // 4: Sensitivities    — amber
  "#127a6a", // 5: Nutrition Density— teal
  "#6a2a9a", // 6: After-Effects    — purple
  "#2a3a9a", // 7: Frequency        — indigo
];

const CARD_TITLES = [
  "What It Is",
  "Body Impact",
  "Goal Alignment",
  "Sensitivities",
  "Nutrition Density",
  "After-Effects",
  "Frequency",
];

/* ============================================================
   Score helpers
   ============================================================ */

function scoreColor(s) {
  if (s == null) return "#aaa";
  if (s >= 7) return "#1a7a3a";
  if (s >= 4) return "#9a5a00";
  return "#a02020";
}

function scoreLabel(s) {
  if (s == null) return null;
  if (s >= 7) return "Good";
  if (s >= 4) return "Moderate";
  return "Low";
}

function ScoreBar({ score, label }) {
  if (score == null) return null;
  const pct = Math.round((score / 10) * 100);
  const color = scoreColor(score);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
      <span style={{ fontSize: 11, color: "#666", minWidth: 90, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 4, background: "#e8e8e8", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color, minWidth: 28, textAlign: "right" }}>
        {score}
      </span>
    </div>
  );
}

function FlagChip({ label, match }) {
  const style = match
    ? { background: "#ecfff4", border: "1px solid #a0dcb8", color: "#1a5c30" }
    : { background: "#fff0f0", border: "1px solid #f0b8b8", color: "#8a2020" };
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      fontSize: 11,
      fontWeight: 700,
      borderRadius: 999,
      padding: "3px 8px",
      margin: "0 4px 4px 0",
      ...style,
    }}>
      {match ? "✓" : "✗"} {label}
    </span>
  );
}

/* ============================================================
   Data derivation — maps API payload → 7 card objects
   ============================================================ */

function normStr(x) { return String(x ?? "").trim(); }
function normNum(x)  { const n = Number(x); return Number.isFinite(n) ? n : null; }

function coverageSourceLabel(ratio) {
  const r = Number(ratio ?? 0);
  if (r >= 0.57) return "Grubbid intelligence";
  if (r >= 0.3)  return "Estimated from menu language";
  return "Estimated from menu language";
}

/* Card 1 — What It Is */
function buildWhatItIs(template, prep, conf, basis, itemName) {
  const dishName   = normStr(template?.template_name || template?.name || itemName || "This dish");
  const cuisine    = normStr(template?.cuisine || "");
  const category   = normStr(template?.category || "");
  const cookMethod = normStr(prep?.cooking_method || "");
  const tplConf    = normNum(conf?.template_confidence_score) ?? 0;
  const prepConf   = normNum(conf?.preparation_inference_confidence) ?? 0;

  const verdictParts = [cuisine, category].filter(Boolean);
  const verdict = verdictParts.length > 0 ? verdictParts.join(" · ") : "Dish type unidentified";

  const bullets = [];
  if (cookMethod && cookMethod !== "raw") bullets.push(`Preparation: ${cookMethod}`);
  const reasoning = Array.isArray(basis?.template_reasoning) ? basis.template_reasoning : [];
  const prepBasis = Array.isArray(prep?.preparation_basis) ? prep.preparation_basis
    : Array.isArray(basis?.preparation_basis) ? basis.preparation_basis : [];
  [...reasoning.slice(0, 1), ...prepBasis.slice(0, 1)].filter(Boolean).forEach(r => bullets.push(r));

  return {
    type:        "identity",
    title:       CARD_TITLES[0],
    dishName,
    verdict,
    bullets:     bullets.slice(0, 3),
    confidence:  Math.max(tplConf, prepConf),
    sourceLabel: tplConf < 0.45 ? "Estimated from menu language" : "Grubbid intelligence",
    scores:      [],
    flags:       [],
  };
}

/* Card 2 — Body Impact */
function buildBodyImpact(scores, sourceLabel) {
  const glycemic  = normNum(scores?.glycemic_score);
  const lasting   = normNum(scores?.lasting_energy_score);
  const sugarLoad = normNum(scores?.sugar_load_score);
  const sodium    = normNum(scores?.sodium_score);

  let verdict = "Insufficient data";
  if (glycemic !== null) {
    if (glycemic >= 7 && lasting !== null && lasting >= 7)       verdict = "Stable energy, stays with you";
    else if (glycemic >= 7 && (lasting === null || lasting >= 5)) verdict = "Moderate energy, balanced impact";
    else if (glycemic < 4)                                        verdict = "High glycemic — expect a spike";
    else if (lasting !== null && lasting < 4)                     verdict = "Quick energy, fades relatively fast";
    else                                                          verdict = "Moderate energy impact";
  }

  const bullets = [];
  if (glycemic !== null) {
    const g = glycemic >= 7 ? "Low glycemic load" : glycemic >= 4 ? "Moderate glycemic load" : "High glycemic load";
    bullets.push(g);
  }
  if (lasting !== null) {
    const l = lasting >= 7 ? "Long-lasting energy" : lasting >= 4 ? "Medium energy duration" : "Short energy window";
    bullets.push(l);
  }
  if (sugarLoad !== null) {
    bullets.push(sugarLoad >= 7 ? "Light sugar load" : sugarLoad >= 4 ? "Moderate sugar" : "Heavy sugar load");
  }
  if (sodium !== null) {
    bullets.push(sodium >= 7 ? "Low sodium" : sodium >= 4 ? "Moderate sodium" : "High sodium");
  }

  return {
    type:        "scores",
    title:       CARD_TITLES[1],
    verdict,
    bullets:     bullets.slice(0, 4),
    sourceLabel,
    scores: [
      { label: "Glycemic", score: glycemic },
      { label: "Energy", score: lasting },
      { label: "Sugar Load", score: sugarLoad },
      { label: "Sodium", score: sodium },
    ].filter(s => s.score !== null),
    flags: [],
  };
}

/* Card 3 — Goal Alignment */
function buildGoalAlignment(diet, sourceLabel) {
  const df = diet || {};
  const flags = [];

  if (df.vegan === true)           flags.push({ label: "Vegan",        match: true });
  else if (df.vegan === false)     flags.push({ label: "Vegan",        match: false });
  if (df.vegetarian === true)      flags.push({ label: "Vegetarian",   match: true });
  if (df.gluten_free === true)     flags.push({ label: "Gluten-Free",  match: true });
  else if (df.gluten_free === false) flags.push({ label: "Gluten-Free", match: false });
  if (df.keto_friendly)            flags.push({ label: "Keto",         match: true });
  if (df.high_protein)             flags.push({ label: "High Protein", match: true });
  if (df.low_carb)                 flags.push({ label: "Low Carb",     match: true });
  if (df.low_sodium)               flags.push({ label: "Low Sodium",   match: true });
  if (df.dairy_free === true)      flags.push({ label: "Dairy-Free",   match: true });
  else if (df.dairy_free === false) flags.push({ label: "Dairy-Free",  match: false });

  const matching = flags.filter(f => f.match);
  let verdict;
  if (flags.length === 0)         verdict = "No diet data available";
  else if (matching.length >= 4)  verdict = "Excellent alignment — many goals supported";
  else if (matching.length >= 2)  verdict = `Fits: ${matching.slice(0, 2).map(f => f.label).join(", ")}`;
  else if (matching.length === 1) verdict = `Fits: ${matching[0].label}`;
  else                            verdict = "Limited goal alignment";

  return {
    type:        "flags",
    title:       CARD_TITLES[2],
    verdict,
    flags,
    bullets:     [],
    sourceLabel,
    scores:      [],
  };
}

/* Card 4 — Sensitivities */
function buildSensitivities(diet, notes) {
  const df = diet || {};
  const concerns = [];
  const safe     = [];

  if (df.gluten_free === false)     concerns.push("Contains gluten");
  else if (df.gluten_free === true) safe.push("Gluten-free");
  else                              concerns.push("Gluten status unknown");

  if (df.dairy_free === false)      concerns.push("Contains dairy");
  else if (df.dairy_free === true)  safe.push("Dairy-free");

  if (df.vegan === false)           concerns.push("Contains animal products");

  // Ingredient notes that relate to allergens/warnings
  const sensitivityTypes = ["allergen", "contains", "warning", "high_sodium", "additive", "sensitivity"];
  const relevant = (notes || [])
    .filter(n => sensitivityTypes.some(t => normStr(n.note_type).includes(t)))
    .slice(0, 2);
  relevant.forEach(n => { if (n.note_value) concerns.push(n.note_value); });

  let verdict;
  if (concerns.length === 0 && safe.length === 0) verdict = "No sensitivity data available";
  else if (concerns.length === 0) verdict = "No common concerns detected";
  else verdict = `${concerns.length} concern${concerns.length > 1 ? "s" : ""} detected`;

  const bullets = [
    ...concerns.map(c => `⚠ ${c}`),
    ...safe.map(s => `✓ ${s}`),
  ];

  return {
    type:        "text",
    title:       CARD_TITLES[3],
    verdict,
    bullets:     bullets.slice(0, 5),
    sourceLabel: "Estimated from menu language",
    scores:      [],
    flags:       [],
  };
}

/* Card 5 — Nutrition Density */
function buildNutritionDensity(scores, nutrition, sourceLabel) {
  const wholeFood   = normNum(scores?.whole_food_score);
  const plant       = normNum(scores?.plant_content_score);
  const calDensity  = normNum(scores?.calorie_density_score);
  const refinedCarb = normNum(scores?.refined_carb_score);

  const key = [wholeFood, plant, refinedCarb].filter(s => s !== null);
  const avg = key.length > 0 ? key.reduce((a, b) => a + b, 0) / key.length : null;

  let verdict;
  if (avg === null)  verdict = "Insufficient data";
  else if (avg >= 7) verdict = "Whole food, nutrient-rich";
  else if (avg >= 5) verdict = "Mixed — some whole, some processed";
  else               verdict = "Processed — lower nutrient density";

  const bullets = [];
  const cal  = normNum(nutrition?.calories_est);
  const prot = normNum(nutrition?.protein_g_est);
  const fib  = normNum(nutrition?.fiber_g_est);
  if (cal  !== null) bullets.push(`~${Math.round(cal)} kcal estimated`);
  if (prot !== null) bullets.push(`~${Math.round(prot)}g protein estimated`);
  if (fib  !== null) bullets.push(`~${Math.round(fib)}g fiber estimated`);

  return {
    type:        "scores",
    title:       CARD_TITLES[4],
    verdict,
    bullets:     bullets.slice(0, 3),
    sourceLabel,
    scores: [
      { label: "Whole Food",   score: wholeFood },
      { label: "Plant Content",score: plant },
      { label: "Low Refined",  score: refinedCarb },
      { label: "Cal Density",  score: calDensity },
    ].filter(s => s.score !== null),
    flags: [],
  };
}

/* Card 6 — After-Effects */
function buildAfterEffects(scores, nutrition, notes, sourceLabel) {
  const lasting    = normNum(scores?.lasting_energy_score);
  const protein    = normNum(scores?.protein_score);
  const fatBalance = normNum(scores?.fat_balance_score);
  const processing = normNum(scores?.processing_score);

  const proteinG = normNum(nutrition?.protein_g_est);
  const fiberG   = normNum(nutrition?.fiber_g_est);
  const satiety  = proteinG !== null && fiberG !== null ? proteinG * 0.5 + fiberG * 1.5 : null;

  let verdict;
  if (lasting === null && protein === null) verdict = "After-effects unknown";
  else if (lasting !== null && lasting >= 7 && (protein === null || protein >= 6)) verdict = "Filling and sustained";
  else if (fatBalance !== null && fatBalance < 4)  verdict = "May feel heavy afterward";
  else if (lasting !== null && lasting < 4)        verdict = "Expect hunger again soon";
  else if (processing !== null && processing < 4)  verdict = "Heavy on the system";
  else                                             verdict = "Moderate after-effects";

  const bullets = [];
  if (satiety !== null) {
    bullets.push(satiety > 15 ? "High satiety" : satiety > 8 ? "Moderate satiety" : "Low satiety");
  }
  if (lasting !== null) {
    bullets.push(
      lasting >= 7 ? "Energy lasts 3–4 hours" :
      lasting >= 4 ? "Energy lasts 1–2 hours" :
      "Energy fades quickly"
    );
  }
  if (fatBalance !== null && fatBalance < 4) bullets.push("High sat. fat — may cause sluggishness");

  const afterTypes = ["satiety", "energy", "heavy", "sluggish"];
  (notes || [])
    .filter(n => afterTypes.some(t => normStr(n.note_type).includes(t)))
    .slice(0, 1)
    .forEach(n => { if (n.note_value) bullets.push(n.note_value); });

  return {
    type:        "scores",
    title:       CARD_TITLES[5],
    verdict,
    bullets:     bullets.slice(0, 4),
    sourceLabel,
    scores: [
      { label: "Lasting Energy", score: lasting },
      { label: "Protein",        score: protein },
      { label: "Fat Balance",    score: fatBalance },
    ].filter(s => s.score !== null),
    flags: [],
  };
}

/* Card 7 — Frequency */
function buildFrequency(scores, sourceLabel) {
  const processing = normNum(scores?.processing_score);
  const sodium     = normNum(scores?.sodium_score);
  const calDensity = normNum(scores?.calorie_density_score);
  const sugarLoad  = normNum(scores?.sugar_load_score);

  const available = [processing, sodium, calDensity, sugarLoad].filter(s => s !== null);
  const avg = available.length > 0 ? available.reduce((a, b) => a + b, 0) / available.length : null;

  let verdict, recommendation, bullets;
  if (avg === null) {
    verdict = "Unknown";
    recommendation = null;
    bullets = ["Insufficient data for frequency recommendation."];
  } else if (avg >= 7) {
    verdict = "Daily-friendly";
    recommendation = "Generally fine to enjoy regularly.";
    bullets = ["Low in problematic components", "Part of a balanced daily diet"];
  } else if (avg >= 5) {
    verdict = "Weekly";
    recommendation = "Best enjoyed a few times a week.";
    const reasons = [];
    if (processing !== null && processing < 6) reasons.push("Some processing detected");
    if (sodium !== null && sodium < 6)         reasons.push("Elevated sodium");
    if (calDensity !== null && calDensity < 6) reasons.push("Higher calorie density");
    bullets = reasons.length > 0 ? reasons : ["Some factors warrant rotation"];
  } else {
    verdict = "Occasional";
    recommendation = "Worth enjoying — limit to once or twice a week.";
    const reasons = [];
    if (processing !== null && processing < 4) reasons.push("High processing level");
    if (sodium !== null && sodium < 4)         reasons.push("Very high sodium");
    if (calDensity !== null && calDensity < 4) reasons.push("Very high calorie density");
    if (sugarLoad !== null && sugarLoad < 4)   reasons.push("Heavy sugar load");
    bullets = reasons.length > 0 ? reasons : ["Multiple factors warrant moderation"];
  }

  return {
    type:           "frequency",
    title:          CARD_TITLES[6],
    verdict,
    recommendation,
    bullets:        bullets.slice(0, 3),
    sourceLabel,
    scores: [
      { label: "Processing", score: processing },
      { label: "Sodium",     score: sodium },
      { label: "Cal Density",score: calDensity },
    ].filter(s => s.score !== null),
    flags: [],
  };
}

function deriveCards(data, itemName) {
  const intel   = data || {};
  const scores  = intel.insight_scores      || {};
  const nutri   = intel.nutrition_estimates || {};
  const diet    = intel.diet_flags          || {};
  const prep    = intel.preparation         || {};
  const tmpl    = intel.template_assignment || {};
  const notes   = intel.ingredient_notes    || [];
  const conf    = intel.confidence          || {};
  const basis   = intel.basis               || {};

  const ratio      = Number(scores.macro_coverage_ratio ?? 0);
  const sourceLabel = coverageSourceLabel(ratio);

  return [
    buildWhatItIs(tmpl, prep, conf, basis, itemName),
    buildBodyImpact(scores, sourceLabel),
    buildGoalAlignment(diet, sourceLabel),
    buildSensitivities(diet, notes),
    buildNutritionDensity(scores, nutri, sourceLabel),
    buildAfterEffects(scores, nutri, notes, sourceLabel),
    buildFrequency(scores, sourceLabel),
  ];
}

/* ============================================================
   Card content renderer
   ============================================================ */

function CardContent({ card, compact, accent }) {
  const bulletStyle = {
    margin: 0,
    padding: 0,
    listStyle: "none",
  };
  const liStyle = {
    fontSize: 12,
    color: "#444",
    lineHeight: 1.5,
    marginBottom: 4,
    paddingLeft: 10,
    position: "relative",
  };
  const dotStyle = {
    position: "absolute",
    left: 0,
    top: 6,
    width: 4,
    height: 4,
    borderRadius: "50%",
    background: accent,
  };

  /* Verdict */
  const verdictEl = (
    <div style={{ fontSize: compact ? 12 : 13, fontWeight: 700, color: "#111", marginBottom: compact ? 6 : 10, lineHeight: 1.4 }}>
      {card.verdict}
    </div>
  );

  /* Identity card (Card 1) */
  if (card.type === "identity") {
    return (
      <>
        {!compact && (
          <div style={{ fontSize: 15, fontWeight: 900, color: "#111", marginBottom: 4, lineHeight: 1.3 }}>
            {card.dishName}
          </div>
        )}
        {verdictEl}
        {!compact && card.bullets.length > 0 && (
          <ul style={bulletStyle}>
            {card.bullets.map((b, i) => (
              <li key={i} style={liStyle}>
                <span style={dotStyle} />
                {b}
              </li>
            ))}
          </ul>
        )}
      </>
    );
  }

  /* Flag chips (Card 3: Goal Alignment) */
  if (card.type === "flags") {
    return (
      <>
        {verdictEl}
        {!compact && card.flags.length > 0 && (
          <div style={{ lineHeight: 1 }}>
            {card.flags.map((f, i) => <FlagChip key={i} label={f.label} match={f.match} />)}
          </div>
        )}
        {compact && card.flags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
            {card.flags.filter(f => f.match).slice(0, 3).map((f, i) => (
              <span key={i} style={{ fontSize: 10, fontWeight: 700, color: "#1a5c30", background: "#ecfff4", border: "1px solid #a0dcb8", borderRadius: 999, padding: "2px 6px" }}>
                {f.label}
              </span>
            ))}
          </div>
        )}
      </>
    );
  }

  /* Frequency card (Card 7) */
  if (card.type === "frequency") {
    return (
      <>
        <div style={{
          fontSize: compact ? 14 : 18,
          fontWeight: 900,
          color: accent,
          marginBottom: 4,
          lineHeight: 1.2,
        }}>
          {card.verdict}
        </div>
        {!compact && card.recommendation && (
          <div style={{ fontSize: 12, color: "#555", marginBottom: 8, lineHeight: 1.5 }}>
            {card.recommendation}
          </div>
        )}
        {!compact && card.bullets.length > 0 && (
          <ul style={bulletStyle}>
            {card.bullets.map((b, i) => (
              <li key={i} style={liStyle}>
                <span style={dotStyle} />
                {b}
              </li>
            ))}
          </ul>
        )}
        {compact && card.scores.length > 0 && (
          <div style={{ marginTop: 4 }}>
            {card.scores.slice(0, 2).map(s => (
              <ScoreBar key={s.label} score={s.score} label={s.label} />
            ))}
          </div>
        )}
      </>
    );
  }

  /* Scores card (Cards 2, 5, 6) */
  if (card.type === "scores") {
    return (
      <>
        {verdictEl}
        {card.scores.length > 0 && (
          <div style={{ marginTop: compact ? 4 : 8 }}>
            {card.scores.slice(0, compact ? 2 : 4).map(s => (
              <ScoreBar key={s.label} score={s.score} label={s.label} />
            ))}
          </div>
        )}
        {!compact && card.bullets.length > 0 && (
          <ul style={{ ...bulletStyle, marginTop: 8 }}>
            {card.bullets.map((b, i) => (
              <li key={i} style={liStyle}>
                <span style={dotStyle} />
                {b}
              </li>
            ))}
          </ul>
        )}
      </>
    );
  }

  /* Text card (Card 4: Sensitivities) */
  return (
    <>
      {verdictEl}
      {!compact && card.bullets.length > 0 && (
        <ul style={bulletStyle}>
          {card.bullets.map((b, i) => (
            <li key={i} style={{ ...liStyle, paddingLeft: 0 }}>{b}</li>
          ))}
        </ul>
      )}
    </>
  );
}

/* ============================================================
   No-data state
   ============================================================ */

function EmptyState({ compact }) {
  return (
    <div style={{
      padding: compact ? "10px 0" : "16px 0",
      fontSize: 12,
      color: "#aaa",
      textAlign: "center",
      lineHeight: 1.5,
    }}>
      <div style={{ fontSize: compact ? 20 : 28, marginBottom: 6 }}>◌</div>
      <div>Intelligence not yet computed for this item.</div>
    </div>
  );
}

/* ============================================================
   Main component
   ============================================================ */

export default function InsightsRolodex({ data, compact = false, itemName = "" }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const touchStartX = useRef(null);

  const PEEK = compact ? PEEK_COMPACT : PEEK_FULL;

  /* --- Guard: no data or all nulls --- */
  const hasData = data && (
    data.insight_scores  ||
    data.diet_flags      ||
    data.template_assignment
  );

  if (!hasData) return <EmptyState compact={compact} />;

  const cards = deriveCards(data, itemName);

  function goTo(idx) {
    setActiveIdx(Math.max(0, Math.min(CARD_COUNT - 1, idx)));
  }

  function onTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e) {
    if (touchStartX.current == null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 40) goTo(activeIdx + (delta < 0 ? 1 : -1));
    touchStartX.current = null;
  }

  function cardTransform(delta) {
    if (delta === 0)  return "translateX(0)";
    if (delta === -1) return `translateX(calc(-100% + ${PEEK}px))`;
    if (delta === 1)  return `translateX(calc(100% - ${PEEK}px))`;
    return `translateX(${delta < 0 ? "-120%" : "120%"})`;
  }

  function cardOpacity(delta) {
    if (delta === 0)          return 1;
    if (Math.abs(delta) === 1) return 0.4;
    return 0;
  }

  const accent = CARD_ACCENT[activeIdx];

  return (
    <div style={{
      fontFamily: "var(--font-ui, ui-sans-serif, system-ui, -apple-system, sans-serif)",
      userSelect: "none",
    }}>
      {/* Grubbid Insights label */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: compact ? 6 : 8,
      }}>
        <span style={{
          fontSize: 10,
          fontWeight: 900,
          color: "#1447a8",
          textTransform: "uppercase",
          letterSpacing: "0.09em",
        }}>
          Grubbid Insights
        </span>
        <span style={{ fontSize: 10, color: "#bbb" }}>
          {activeIdx + 1} / {CARD_COUNT}
        </span>
      </div>

      {/* Rolodex track */}
      <div
        style={{ position: "relative", overflow: "hidden" }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {cards.map((card, i) => {
          const delta   = i - activeIdx;
          const isActive = delta === 0;
          const isAdj   = Math.abs(delta) === 1;

          return (
            <div
              key={i}
              style={{
                position: isActive ? "relative" : "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: cardTransform(delta),
                opacity: cardOpacity(delta),
                transition: "transform 0.22s ease, opacity 0.22s ease",
                pointerEvents: Math.abs(delta) > 1 ? "none" : "auto",
                cursor: isAdj ? "pointer" : "default",
                // Card shell
                borderRadius: 10,
                border: `1px solid ${isActive ? CARD_ACCENT[i] + "55" : "#e5e5e5"}`,
                background: "#fff",
                borderLeft: `4px solid ${CARD_ACCENT[i]}`,
                boxShadow: isActive ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
                boxSizing: "border-box",
              }}
              onClick={isAdj ? () => goTo(i) : undefined}
            >
              {/* Card header */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: compact ? "7px 10px 4px 10px" : "9px 12px 5px 12px",
                borderBottom: `1px solid ${CARD_ACCENT[i]}22`,
              }}>
                <span style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: CARD_ACCENT[i],
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  whiteSpace: "nowrap",
                }}>
                  {card.title}
                </span>
                {isActive && (
                  <span style={{ fontSize: 10, color: "#bbb", whiteSpace: "nowrap" }}>
                    {i + 1} of 7
                  </span>
                )}
              </div>

              {/* Card body */}
              <div style={{
                padding: compact ? "8px 10px 8px 10px" : "10px 12px 12px 12px",
                minHeight: compact ? 70 : 120,
              }}>
                <CardContent card={card} compact={compact} accent={CARD_ACCENT[i]} />
              </div>

              {/* Source label (full mode only, active card only) */}
              {isActive && !compact && (
                <div style={{
                  padding: "4px 12px 7px 12px",
                  fontSize: 10,
                  color: "#aaa",
                  lineHeight: 1.4,
                }}>
                  {card.sourceLabel}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Navigation */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: compact ? 6 : 10,
      }}>
        <button
          type="button"
          onClick={() => goTo(activeIdx - 1)}
          disabled={activeIdx === 0}
          aria-label="Previous insight card"
          style={{
            background: "none",
            border: "none",
            fontSize: 18,
            lineHeight: 1,
            padding: "2px 6px",
            cursor: activeIdx === 0 ? "not-allowed" : "pointer",
            color: activeIdx === 0 ? "#ddd" : accent,
            transition: "color 0.15s",
          }}
        >
          ‹
        </button>

        {/* Dot indicators */}
        <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
          {cards.map((card, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={card.title}
              title={card.title}
              style={{
                width: i === activeIdx ? 16 : 5,
                height: 5,
                borderRadius: 3,
                background: i === activeIdx ? accent : "#ddd",
                border: "none",
                cursor: "pointer",
                padding: 0,
                transition: "width 0.18s ease, background 0.18s ease",
                flexShrink: 0,
              }}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => goTo(activeIdx + 1)}
          disabled={activeIdx === CARD_COUNT - 1}
          aria-label="Next insight card"
          style={{
            background: "none",
            border: "none",
            fontSize: 18,
            lineHeight: 1,
            padding: "2px 6px",
            cursor: activeIdx === CARD_COUNT - 1 ? "not-allowed" : "pointer",
            color: activeIdx === CARD_COUNT - 1 ? "#ddd" : accent,
            transition: "color 0.15s",
          }}
        >
          ›
        </button>
      </div>
    </div>
  );
}
