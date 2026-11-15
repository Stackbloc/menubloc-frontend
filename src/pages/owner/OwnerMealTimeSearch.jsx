import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import OwnerLayout, { OWNER_COLORS, PageCard } from "./OwnerLayout.jsx";
import {
  addOwnerMealTimeOverride,
  checkOwnerMealTimeSearch,
  getOwnerMealTimeDishes,
  getOwnerMealTimeHistory,
  getOwnerMealTimeOverrides,
  getOwnerMealTimeRules,
  getOwnerRestaurantOperationClusters,
  getOwnerRestaurantOperations,
  putBackOwnerMealTimeOverride,
  removeOwnerMealTimeOverride,
  restoreOwnerMealTimeRules,
  saveOwnerMealTimeRules,
} from "../../lib/ownerApi.js";

/**
 * Owner → Right now meals (plan 43, Andre 2026-11-15).
 * What diners get when they tap Breakfast / Lunch / Dinner / Late night on the app's Search.
 * Rules (saved as versions with Undo), pins & hides per meal, and a read-only Check.
 */

const MEAL_LABEL = { breakfast: "Breakfast", brunch: "Brunch", lunch: "Lunch", dinner: "Dinner", late_night: "Late night" };
const NUMBER_FIELDS = [
  ["maxCards", "Places shown", "places"],
  ["dishesPerCard", "Dishes per restaurant card", ""],
  ["sameTypePerCard", "Same kind of dish on one card", ""],
  ["maxTypeShareOfCards", "Most cards one kind of dish may lead", "%"],
  ["minCardsPerType", "…but never fewer than", "cards"],
  ["fetchRestaurants", "Places looked at before trimming", "places"],
];
const FIELD_LABEL = {
  maxCards: "Places shown",
  dishesPerCard: "Dishes per card",
  sameTypePerCard: "Same kind per card",
  maxTypeShareOfCards: "Most cards one kind may lead",
  minCardsPerType: "Never fewer than",
  fetchRestaurants: "Places looked at",
  enabled: "On",
  onlyMealDishes: "Only dishes for this meal",
  preferred: "Staples first",
  mainsFromStarters: "Starters that count as a meal",
  openLateFirst: "Open late first",
};

const kindLabel = (k) => {
  const s = String(k).replace(/^code:/, "").replace(/_/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
};
const when = (v) => (v ? new Date(v).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "");
const day = (v) => (v ? new Date(v).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }) : "");
const clone = (x) => JSON.parse(JSON.stringify(x));

function showValue(field, v) {
  if (v == null) return "automatic";
  if (typeof v === "boolean") return v ? "on" : "off";
  if (Array.isArray(v)) return v.length ? v.map(kindLabel).join(", ") : "none";
  if (field === "maxTypeShareOfCards") return `${Math.round(v * 100)}%`;
  return String(v);
}

function changeText(c) {
  const parts = c.field.split(".");
  const key = parts[parts.length - 1];
  const meal = parts.length === 3 ? `${MEAL_LABEL[parts[1]]}: ` : "";
  return `${meal}${FIELD_LABEL[key] || key} ${showValue(key, c.before)} → ${showValue(key, c.after)}`;
}

export default function OwnerMealTimeSearch() {
  const [params, setParams] = useSearchParams();
  const tab = ["rules", "pins", "check"].includes(params.get("tab")) ? params.get("tab") : "rules";
  const setTab = (t) => {
    const next = new URLSearchParams(params);
    next.set("tab", t);
    setParams(next, { replace: true });
  };
  const muted = { color: OWNER_COLORS.muted, fontSize: 13 };

  return (
    <OwnerLayout title="Right now meals">
      <div style={{ display: "grid", gap: 16 }}>
        <PageCard style={{ padding: 20 }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>Right now meals</h2>
          <p style={{ ...muted, margin: "6px 0 0", maxWidth: 760 }}>
            What diners get when they tap Breakfast, Lunch, Dinner or Late night on Search in the app.
            Changes reach diners within a minute. Typed food searches, Today and menus don't change.
          </p>
          <p style={{ ...muted, margin: "6px 0 0", maxWidth: 760 }}>
            Which kinds of food count for each meal is set by food type on{" "}
            <a href="/owner/food-intelligence/mealtime" style={{ color: OWNER_COLORS.ink }}>Food Intelligence → Mealtimes</a>.
            Built-in starter choices apply until someone sets a food type there by hand. Typed “dinner”,
            “lunch ideas” and “entrees” use the same meal search.
          </p>
          <nav style={{ display: "flex", gap: 20, marginTop: 14 }} aria-label="Sections">
            {[
              ["rules", "Rules"],
              ["pins", "Pins & hides"],
              ["check", "Check"],
            ].map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setTab(k)}
                aria-current={tab === k ? "page" : undefined}
                style={{ ...tabBtn, color: tab === k ? OWNER_COLORS.ink : OWNER_COLORS.muted, borderBottomColor: tab === k ? OWNER_COLORS.ink : "transparent" }}
              >
                {label}
              </button>
            ))}
          </nav>
        </PageCard>
        {tab === "rules" ? <RulesTab /> : null}
        {tab === "pins" ? <PinsTab /> : null}
        {tab === "check" ? <CheckTab params={params} /> : null}
      </div>
    </OwnerLayout>
  );
}

// ── Rules ──────────────────────────────────────────────────────────────────────────────

function RulesTab() {
  const [data, setData] = useState(null);
  const [draft, setDraft] = useState(null);
  const [history, setHistory] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState([]);
  const [note, setNote] = useState("");
  const muted = { color: OWNER_COLORS.muted, fontSize: 13 };

  const load = useCallback(async () => {
    const [rules, hist] = await Promise.all([getOwnerMealTimeRules(), getOwnerMealTimeHistory()]);
    setData(rules);
    setDraft(clone(rules.rules));
    setHistory(hist.versions || []);
  }, []);

  useEffect(() => {
    load().catch((e) => setError(e?.message || "Could not load"));
  }, [load]);

  const dirty = data && draft && JSON.stringify(draft) !== JSON.stringify(data.rules);
  const setNum = (key, raw) => setDraft((d) => ({ ...d, [key]: key === "maxTypeShareOfCards" ? Number(raw) / 100 : Number(raw) }));
  const setMeal = (meal, key, value) => setDraft((d) => ({ ...d, meals: { ...d.meals, [meal]: { ...d.meals[meal], [key]: value } } }));

  async function run(fn, okText) {
    setBusy(true);
    setError("");
    setFieldErrors([]);
    setNote("");
    try {
      const res = await fn();
      setNote(res.unchanged ? "Nothing changed." : okText(res));
      await load();
    } catch (e) {
      setError(e?.message || "Could not save");
      setFieldErrors(e?.payload?.fields || []);
      if (e?.status === 409) await load();
    } finally {
      setBusy(false);
    }
  }

  const save = () =>
    run(
      () => saveOwnerMealTimeRules({ rules: draft, based_on: data.version?.id || 0 }),
      (res) => `Saved. ${res.changes.length} change${res.changes.length === 1 ? "" : "s"}; live within a minute.`
    );
  const restore = (version) =>
    run(
      () => restoreOwnerMealTimeRules(version, data.version?.id || 0),
      () => (version === "default" ? "Back to the default rules." : `Version ${version} is back.`)
    );

  if (!data || !draft) {
    return <PageCard style={{ padding: 20 }}><div style={muted}>{error || "Loading…"}</div></PageCard>;
  }
  const limits = data.limits || {};
  const errFor = (field) => fieldErrors.find((f) => f.field === field || f.field.startsWith(`${field}.`));

  return (
    <>
      <PageCard style={{ padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "baseline" }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>Every meal</h3>
          <span style={muted}>
            {data.is_default ? "Using the default rules" : `Saved ${when(data.version?.set_at)}`}
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 14, marginTop: 14 }}>
          {NUMBER_FIELDS.map(([key, label, unit]) => {
            const lim = limits[key] || {};
            const pct = key === "maxTypeShareOfCards";
            const value = pct ? Math.round(draft[key] * 100) : draft[key];
            const changed = draft[key] !== data.defaults[key];
            return (
              <label key={key} style={{ display: "grid", gap: 4, fontSize: 13 }}>
                <span style={{ fontWeight: 700 }}>{label}</span>
                <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input
                    type="number"
                    style={{ ...inputStyle, width: 80 }}
                    min={pct ? lim.min * 100 : lim.min}
                    max={pct ? lim.max * 100 : lim.max}
                    step={pct ? 5 : 1}
                    value={value}
                    onChange={(e) => setNum(key, e.target.value)}
                  />
                  <span style={muted}>{unit}</span>
                </span>
                <span style={{ ...muted, fontSize: 12 }}>
                  {pct ? `${lim.min * 100}–${lim.max * 100}%` : `${lim.min}–${lim.max}`} · default {pct ? `${Math.round(data.defaults[key] * 100)}%` : data.defaults[key]}
                  {changed ? " · changed" : ""}
                </span>
                {errFor(key) ? <span style={{ color: "#9f3a22", fontSize: 12 }}>{errFor(key).message}</span> : null}
              </label>
            );
          })}
        </div>
      </PageCard>

      <PageCard style={{ padding: 20 }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>Each meal</h3>
        <p style={{ ...muted, margin: "6px 0 0" }}>
          Off = that meal shows the regular search results. Only dishes for this meal = breakfast dishes for Breakfast and Brunch.
          Staples go first on each card. Starters that count as a meal are kept even when a menu files them under starters.
        </p>
        <div style={{ display: "grid", gap: 2, marginTop: 12 }}>
          {data.meals.map((meal) => (
            <MealRow
              key={meal}
              meal={meal}
              value={draft.meals[meal]}
              defaults={data.defaults.meals[meal]}
              kinds={data.dish_kinds}
              onChange={(key, v) => setMeal(meal, key, v)}
              error={errFor(`meals.${meal}`)}
            />
          ))}
        </div>
      </PageCard>

      <PageCard style={{ padding: 20 }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <button type="button" style={{ ...darkBtn, opacity: dirty && !busy ? 1 : 0.4 }} disabled={!dirty || busy} onClick={save}>Save</button>
          {dirty ? (
            <button type="button" style={linkStyle} disabled={busy} onClick={() => setDraft(clone(data.rules))}>Discard changes</button>
          ) : null}
          {!data.is_default ? (
            <button type="button" style={linkStyle} disabled={busy} onClick={() => restore("default")}>Back to default</button>
          ) : null}
          {note ? <span style={muted}>{note}</span> : null}
          {error ? <span style={{ color: "#9f3a22", fontSize: 13 }}>{error}</span> : null}
        </div>
      </PageCard>

      <PageCard style={{ padding: 20 }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>Saved versions</h3>
        {!history.length ? <div style={{ ...muted, marginTop: 10 }}>Nothing saved yet; the default rules are live.</div> : null}
        <div style={{ display: "grid", marginTop: 8 }}>
          {history.map((v, i) => (
            <div key={v.id} style={{ borderTop: `1px solid ${OWNER_COLORS.line}`, padding: "10px 0", display: "grid", gap: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>
                  Version {v.id}
                  {i === 0 ? <span style={{ ...muted, fontWeight: 400 }}> · live</span> : null}
                  {v.note ? <span style={{ ...muted, fontWeight: 400 }}> · {v.note}</span> : null}
                </span>
                <span style={muted}>
                  {when(v.set_at)}
                  {v.set_by_email ? ` · ${v.set_by_email}` : ""}
                  {i > 0 ? (
                    <>
                      {" · "}
                      <button type="button" style={linkStyle} disabled={busy} onClick={() => restore(v.id)}>Put this back</button>
                    </>
                  ) : null}
                </span>
              </div>
              <div style={muted}>{v.changes.length ? v.changes.map(changeText).join(" · ") : v.is_default ? "The default rules" : "No changes"}</div>
            </div>
          ))}
        </div>
      </PageCard>
    </>
  );
}

function MealRow({ meal, value, defaults, kinds, onChange, error }) {
  const muted = { color: OWNER_COLORS.muted, fontSize: 12 };
  return (
    <div style={{ borderTop: `1px solid ${OWNER_COLORS.line}`, padding: "12px 0", display: "grid", gap: 8 }}>
      <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontWeight: 800, fontSize: 14, minWidth: 90 }}>{MEAL_LABEL[meal]}</span>
        <Check label="On" checked={value.enabled} onChange={(v) => onChange("enabled", v)} />
        <Check label="Only dishes for this meal" checked={value.onlyMealDishes} onChange={(v) => onChange("onlyMealDishes", v)} disabled={!value.enabled} />
        {meal === "late_night" ? (
          <Check label="Open late first" checked={Boolean(value.openLateFirst)} onChange={(v) => onChange("openLateFirst", v)} disabled={!value.enabled} />
        ) : null}
      </div>
      {value.enabled ? (
        <div style={{ display: "grid", gap: 6, paddingLeft: 110 }}>
          <KindPicker label="Staples first" emptyText="Automatic" value={value.preferred || []} defaults={defaults.preferred || []} kinds={kinds} onChange={(v) => onChange("preferred", v.length ? v : null)} />
          <KindPicker label="Starters that count as a meal" emptyText="None" value={value.mainsFromStarters || []} defaults={defaults.mainsFromStarters || []} kinds={kinds} onChange={(v) => onChange("mainsFromStarters", v)} />
          {meal === "late_night" && value.openLateFirst ? (
            <div style={muted}>Places open late (closing 9 PM or later, overnight or 24 hrs) go first, then places with no hours, then places that close early. Nobody is hidden.</div>
          ) : null}
        </div>
      ) : (
        <div style={{ ...muted, paddingLeft: 110 }}>Off: diners get the regular search results for this meal.</div>
      )}
      {error ? <div style={{ color: "#9f3a22", fontSize: 12, paddingLeft: 110 }}>{error.message}</div> : null}
    </div>
  );
}

function Check({ label, checked, onChange, disabled }) {
  return (
    <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 13, opacity: disabled ? 0.4 : 1 }}>
      <input type="checkbox" checked={Boolean(checked)} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

function KindPicker({ label, emptyText, value, defaults, kinds, onChange }) {
  const [open, setOpen] = useState(false);
  const set = new Set(value);
  const isDefault = JSON.stringify([...value].sort()) === JSON.stringify([...defaults].sort());
  const toggle = (k) => onChange(set.has(k) ? value.filter((x) => x !== k) : [...value, k]);
  return (
    <div style={{ fontSize: 13 }}>
      <span style={{ fontWeight: 700 }}>{label}: </span>
      <span>{value.length ? value.map(kindLabel).join(", ") : emptyText}</span>
      <span style={{ color: OWNER_COLORS.muted }}>{isDefault ? " · default" : " · changed"}</span>
      {" · "}
      <button type="button" style={linkStyle} onClick={() => setOpen((o) => !o)}>{open ? "Done" : "Edit"}</button>
      {open ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 4, marginTop: 8 }}>
          {kinds.map((k) => (
            <label key={k} style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 13 }}>
              <input type="checkbox" checked={set.has(k)} onChange={() => toggle(k)} />
              {kindLabel(k)}
            </label>
          ))}
          <div style={{ gridColumn: "1 / -1", display: "flex", gap: 14, marginTop: 4 }}>
            <button type="button" style={linkStyle} onClick={() => onChange(defaults)}>Use default</button>
            <button type="button" style={linkStyle} onClick={() => onChange([])}>Clear</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ── Pins & hides ───────────────────────────────────────────────────────────────────────

function PinsTab() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const muted = { color: OWNER_COLORS.muted, fontSize: 13 };

  const load = useCallback(() => getOwnerMealTimeOverrides().then(setData), []);
  useEffect(() => {
    load().catch((e) => setError(e?.message || "Could not load"));
  }, [load]);

  async function act(fn, okText) {
    setBusy(true);
    setError("");
    setNote("");
    try {
      await fn();
      setNote(okText);
      await load();
    } catch (e) {
      setError(e?.message || "Could not save");
    } finally {
      setBusy(false);
    }
  }

  const byMeal = useMemo(() => {
    const out = {};
    for (const o of data?.overrides || []) (out[o.meal] = out[o.meal] || []).push(o);
    return out;
  }, [data]);

  return (
    <>
      <PageCard style={{ padding: 20 }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>Pin or hide</h3>
        <p style={{ ...muted, margin: "6px 0 0" }}>
          Pin: when the search finds this place near a diner, it goes first (a pinned dish goes first on its card). Pins never bring in places from far away.
          Hide: it doesn't show for that meal on the Right now card. Typed searches, Today and menus don't change.
        </p>
        <AddOverride busy={busy} onAdd={(body, label) => act(() => addOwnerMealTimeOverride(body), `${label} added.`)} />
        {note ? <div style={{ ...muted, marginTop: 10 }}>{note}</div> : null}
        {error ? <div style={{ color: "#9f3a22", fontSize: 13, marginTop: 10 }}>{error}</div> : null}
      </PageCard>

      <PageCard style={{ padding: 20 }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>Live now</h3>
        {!data ? <div style={{ ...muted, marginTop: 10 }}>Loading…</div> : null}
        {data && !data.overrides.length ? <div style={{ ...muted, marginTop: 10 }}>No pins or hides.</div> : null}
        {Object.keys(MEAL_LABEL)
          .filter((m) => byMeal[m])
          .map((m) => (
            <div key={m} style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 800, fontSize: 14 }}>{MEAL_LABEL[m]}</div>
              {byMeal[m].map((o) => (
                <OverrideRow key={o.id} o={o} action={<button type="button" style={linkStyle} disabled={busy} onClick={() => act(() => removeOwnerMealTimeOverride(o.id), "Removed.")}>Remove</button>} />
              ))}
            </div>
          ))}
      </PageCard>

      {data?.recently_removed?.length ? (
        <PageCard style={{ padding: 20 }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>Recently removed</h3>
          {data.recently_removed.map((o) => (
            <OverrideRow
              key={o.id}
              o={o}
              meal
              action={<button type="button" style={linkStyle} disabled={busy} onClick={() => act(() => putBackOwnerMealTimeOverride(o.id), "Put back.")}>Put back</button>}
            />
          ))}
        </PageCard>
      ) : null}
    </>
  );
}

function OverrideRow({ o, action, meal }) {
  const muted = { color: OWNER_COLORS.muted, fontSize: 13 };
  const dishName = o.dish_name || `Dish ${o.menu_item_id}`;
  const where = o.restaurant_name || `#${o.restaurant_id}`;
  const what = o.target_kind === "dish" ? (o.brand_dish ? `${dishName} at every ${where} store` : `${dishName} at ${where}`) : where;
  const place = [o.city, o.state].filter(Boolean).join(", ");
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", borderTop: `1px solid ${OWNER_COLORS.line}`, padding: "8px 0", fontSize: 14 }}>
      <span>
        <b>{o.action === "pin" ? "Pinned" : "Hidden"}{o.target_kind === "dish" ? " dish" : ""}</b>
        {meal ? ` · ${MEAL_LABEL[o.meal]}` : ""} · {what}
        {place ? <span style={muted}> · {place}</span> : null}
        {o.expires_at ? <span style={muted}> · {o.expired ? "ended" : "until"} {day(o.expires_at)}</span> : null}
        {o.note ? <span style={muted}> · {o.note}</span> : null}
      </span>
      <span style={muted}>
        {when(o.removed_at || o.set_at)} · {action}
      </span>
    </div>
  );
}

function AddOverride({ busy, onAdd }) {
  const [meal, setMeal] = useState("breakfast");
  const [action, setAction] = useState("pin");
  const [kind, setKind] = useState("restaurant");
  const [q, setQ] = useState("");
  const [found, setFound] = useState([]);
  const [place, setPlace] = useState(null);
  const [dishQ, setDishQ] = useState("");
  const [dishes, setDishes] = useState(null);
  const [dish, setDish] = useState(null);
  const [until, setUntil] = useState("");
  const [note, setNote] = useState("");
  const muted = { color: OWNER_COLORS.muted, fontSize: 13 };

  const searching = !place && q.trim().length >= 2;
  useEffect(() => {
    if (!searching) return undefined;
    let live = true;
    const t = setTimeout(() => {
      getOwnerRestaurantOperations({ q: q.trim(), page_size: "8" })
        .then((res) => live && setFound(res?.restaurants || []))
        .catch(() => live && setFound([]));
    }, 300);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [q, searching]);

  useEffect(() => {
    if (!place || kind !== "dish") return undefined;
    let live = true;
    const t = setTimeout(() => {
      getOwnerMealTimeDishes(place.restaurant_id, dishQ.trim())
        .then((res) => live && setDishes(res))
        .catch(() => live && setDishes({ dishes: [] }));
    }, 250);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [place, kind, dishQ]);

  const ready = place && (kind === "restaurant" || dish);
  const reset = () => {
    setPlace(null);
    setQ("");
    setDish(null);
    setDishQ("");
    setDishes(null);
    setUntil("");
    setNote("");
  };
  const submit = () => {
    const label = `${action === "pin" ? "Pin" : "Hide"} for ${MEAL_LABEL[meal]}`;
    onAdd(
      {
        meal,
        action,
        target_kind: kind,
        restaurant_id: place.restaurant_id,
        menu_item_id: kind === "dish" ? dish.id : null,
        expires_at: until ? new Date(`${until}T23:59:59`).toISOString() : null,
        note: note.trim() || null,
      },
      label
    );
    reset();
  };

  return (
    <div style={{ display: "grid", gap: 12, marginTop: 14, maxWidth: 720 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <select style={inputStyle} value={action} onChange={(e) => setAction(e.target.value)} aria-label="Pin or hide">
          <option value="pin">Pin</option>
          <option value="hide">Hide</option>
        </select>
        <select style={inputStyle} value={kind} onChange={(e) => { setKind(e.target.value); setDish(null); }} aria-label="Restaurant or dish">
          <option value="restaurant">a restaurant</option>
          <option value="dish">a dish</option>
        </select>
        <span style={{ alignSelf: "center", fontSize: 13 }}>for</span>
        <select style={inputStyle} value={meal} onChange={(e) => setMeal(e.target.value)} aria-label="Meal">
          {Object.entries(MEAL_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
      </div>

      {place ? (
        <div style={{ fontSize: 14 }}>
          <b>{place.restaurant_name}</b> #{place.restaurant_id}
          {place.city ? <span style={muted}> · {[place.city, place.state].filter(Boolean).join(", ")}</span> : null}
          {" · "}
          <button type="button" style={linkStyle} onClick={reset}>Change</button>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 4 }}>
          <input style={{ ...inputStyle, maxWidth: 360 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Restaurant name or #ID" aria-label="Find a restaurant" />
          {(searching ? found : []).map((r) => (
            <button key={r.restaurant_id} type="button" style={{ ...linkStyle, textAlign: "left", fontWeight: 600, color: OWNER_COLORS.ink }} onClick={() => setPlace(r)}>
              {r.restaurant_name} <span style={muted}>#{r.restaurant_id}{r.city ? ` · ${[r.city, r.state].filter(Boolean).join(", ")}` : ""}</span>
            </button>
          ))}
        </div>
      )}

      {place && kind === "dish" ? (
        dish ? (
          <div style={{ fontSize: 14 }}>
            Dish: <b>{dish.name}</b> <span style={muted}>· {kindLabel(dish.kind)}{dish.brand ? " · every store of this chain" : ""}</span> · <button type="button" style={linkStyle} onClick={() => setDish(null)}>Change</button>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 4 }}>
            <input style={{ ...inputStyle, maxWidth: 360 }} value={dishQ} onChange={(e) => setDishQ(e.target.value)} placeholder="Filter dishes" aria-label="Find a dish" />
            {dishes?.chain ? <div style={muted}>Brand dishes apply at every store of this chain.</div> : null}
            {dishes && !dishes.dishes.length ? <div style={muted}>No dishes found.</div> : null}
            <div style={{ maxHeight: 220, overflowY: "auto", display: "grid", gap: 2 }}>
              {(dishes?.dishes || []).map((d) => (
                <button key={d.id} type="button" style={{ ...linkStyle, textAlign: "left", fontWeight: 600, color: OWNER_COLORS.ink }} onClick={() => setDish(d)}>
                  {d.name} <span style={muted}>{d.section ? `· ${d.section}` : ""}{d.brand ? " · every store" : ""}</span>
                </button>
              ))}
            </div>
          </div>
        )
      ) : null}

      {place ? (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <label style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
            Until (optional)
            <input type="date" style={inputStyle} value={until} onChange={(e) => setUntil(e.target.value)} />
          </label>
          <input style={{ ...inputStyle, minWidth: 220 }} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" aria-label="Note" />
          <button type="button" style={{ ...darkBtn, opacity: ready && !busy ? 1 : 0.4 }} disabled={!ready || busy} onClick={submit}>
            {action === "pin" ? "Pin" : "Hide"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

// ── Check ──────────────────────────────────────────────────────────────────────────────

function CheckTab({ params }) {
  const fromId = params.get("restaurant_id");
  const fromName = params.get("name");
  const [clusters, setClusters] = useState([]);
  const [where, setWhere] = useState(fromId ? "restaurant" : "");
  const [custom, setCustom] = useState("");
  const [meal, setMeal] = useState(params.get("meal") || defaultMeal());
  // { key, result, error } for the last finished check; loading = the current key hasn't finished.
  const [done, setDone] = useState({ key: null, result: null, error: "" });
  const [showAll, setShowAll] = useState(false);
  const muted = { color: OWNER_COLORS.muted, fontSize: 13 };

  useEffect(() => {
    getOwnerRestaurantOperationClusters().then((c) => setClusters(Array.isArray(c) ? c : c?.clusters || [])).catch(() => setClusters([]));
  }, []);

  const point = useMemo(() => {
    if (where === "restaurant" && fromId) return { restaurant_id: fromId };
    if (where === "custom") {
      const [lat, lng] = custom.split(",").map((s) => Number(s.trim()));
      return Number.isFinite(lat) && Number.isFinite(lng) && custom.includes(",") ? { lat, lng } : null;
    }
    const c = clusters.find((x) => String(x.id) === where);
    return c && c.lat != null && c.lng != null ? { lat: c.lat, lng: c.lng } : null;
  }, [where, custom, clusters, fromId]);

  const query = useMemo(() => (point ? { ...point, meal, ...(fromId ? { focus_restaurant_id: fromId } : {}) } : null), [point, meal, fromId]);
  const key = query ? JSON.stringify(query) : null;
  useEffect(() => {
    if (!query) return undefined;
    let live = true;
    checkOwnerMealTimeSearch(query)
      .then((res) => live && setDone({ key: JSON.stringify(query), result: res, error: "" }))
      .catch((e) => live && setDone((d) => ({ key: JSON.stringify(query), result: d.result, error: e?.message || "Could not check" })));
    return () => {
      live = false;
    };
  }, [query]);
  const loading = Boolean(key) && done.key !== key;
  const result = done.result;
  const error = done.key === key ? done.error : "";

  const s = result?.summary;
  const shown = (result?.cards || []).filter((c) => c.outcome === "kept").sort((a, b) => a.rank - b.rank);
  const notShown = (result?.cards || []).filter((c) => c.outcome !== "kept");

  return (
    <PageCard style={{ padding: 20 }}>
      <h3 style={{ margin: 0, fontSize: 16 }}>Check meal search</h3>
      <p style={{ ...muted, margin: "6px 0 0" }}>Runs the real search a diner standing here gets for this meal, and shows why each dish did or didn't make it. Nothing is saved.</p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14, alignItems: "center" }}>
        <select style={inputStyle} value={where} onChange={(e) => setWhere(e.target.value)} aria-label="Diner standing at">
          <option value="">Diner standing at…</option>
          {fromId ? <option value="restaurant">{fromName || `Restaurant #${fromId}`}</option> : null}
          {clusters.filter((c) => c.lat != null && c.lng != null).map((c) => (
            <option key={c.id} value={String(c.id)}>{c.name}</option>
          ))}
          <option value="custom">A spot (lat, lng)</option>
        </select>
        {where === "custom" ? (
          <input style={inputStyle} value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="34.0224, -118.2851" aria-label="Lat, lng" />
        ) : null}
        <select style={inputStyle} value={meal} onChange={(e) => setMeal(e.target.value)} aria-label="Meal">
          {Object.entries(MEAL_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        {loading ? <span style={muted}>Checking…</span> : null}
      </div>
      {error ? <div style={{ color: "#9f3a22", fontSize: 13, marginTop: 12 }}>{error}</div> : null}
      {!point && !error ? <div style={{ ...muted, marginTop: 12 }}>Pick where the diner is standing.</div> : null}

      {result && point ? (
        <div style={{ marginTop: 16, opacity: loading ? 0.5 : 1 }}>
          {result.focus ? (
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: result.focus.outcome === "kept" ? OWNER_COLORS.ink : "#9f3a22" }}>
              {fromName || `#${fromId}`}: {result.focus.outcome === "kept" && result.focus.rank ? `shown at #${result.focus.rank}` : result.focus.outcome_label}
            </div>
          ) : null}
          <div style={muted}>
            Search for “{result.query}” · {result.meal_off ? `${MEAL_LABEL[result.meal]} is off, so these are the regular results` : result.is_default ? "default rules" : `rules version ${result.version?.id}`}
            {result.point?.at_restaurant ? ` · standing at ${result.point.at_restaurant.name}` : ""} · {result.took_ms} ms
          </div>
          {s ? (
            <div style={{ fontSize: 14, marginTop: 6 }}>
              {result.returned.length} places shown of {result.fetched_cards} found · {s.dishes_dropped} dishes left out
              {s.moved_for_variety ? ` · ${s.moved_for_variety} moved down for variety` : ""}
              {s.shown_first_at_other_meal ? ` · ${s.shown_first_at_other_meal} shown first at ${result.meal === "lunch" ? "Dinner" : "Lunch"}` : ""}
              {s.pinned_by_owner ? ` · ${s.pinned_by_owner} pinned` : ""}
              {s.hidden_by_owner ? ` · ${s.hidden_by_owner} hidden` : ""}
              {s.open_late_first ? " · open late first" : ""}
            </div>
          ) : null}

          {result.meal_off || !result.cards.length ? (
            <ol style={{ margin: "12px 0 0", paddingLeft: 22, fontSize: 14 }}>
              {result.returned.map((r) => (
                <li key={`${r.rank}-${r.restaurant_id}`}>{r.restaurant_name} <span style={muted}>· {r.dishes.map((d) => d.name).join(", ")}</span></li>
              ))}
            </ol>
          ) : (
            <>
              <div style={{ display: "grid", marginTop: 12 }}>
                {shown.map((c) => <CardTrace key={`k${c.restaurant_id}`} c={c} meal={result.meal} focus={String(c.restaurant_id) === String(fromId)} />)}
              </div>
              {notShown.length ? (
                <div style={{ marginTop: 16 }}>
                  <button type="button" style={linkStyle} onClick={() => setShowAll((v) => !v)}>
                    {showAll ? "Hide" : "Show"} {notShown.length} place{notShown.length === 1 ? "" : "s"} not shown
                  </button>
                  {showAll ? (
                    <div style={{ display: "grid", marginTop: 8 }}>
                      {notShown.map((c) => <CardTrace key={`n${c.restaurant_id}`} c={c} meal={result.meal} focus={String(c.restaurant_id) === String(fromId)} />)}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </>
          )}
          <div style={{ ...muted, marginTop: 14, fontSize: 12 }}>{result.notes.join(" ")}</div>
        </div>
      ) : null}
    </PageCard>
  );
}

function CardTrace({ c, meal, focus }) {
  const [open, setOpen] = useState(focus);
  const muted = { color: OWNER_COLORS.muted, fontSize: 13 };
  const shownDishes = c.dishes.filter((d) => d.shown);
  const tier = c.late_tier === 0 ? "open late" : c.late_tier === 2 ? "closes early" : c.late_tier === 1 ? "no hours" : null;
  return (
    <div style={{ borderTop: `1px solid ${OWNER_COLORS.line}`, padding: "8px 0", background: focus ? OWNER_COLORS.accentSoft : "transparent" }}>
      <button type="button" onClick={() => setOpen((o) => !o)} style={{ ...rowBtn }}>
        <span>
          <b>{c.outcome === "kept" ? `#${c.rank} ` : ""}{c.restaurant_name || `#${c.restaurant_id}`}</b>
          {c.distance_miles != null ? <span style={muted}> · {Number(c.distance_miles).toFixed(1)} mi</span> : null}
          {c.outcome !== "kept" ? <span style={{ color: "#9f3a22", fontSize: 13 }}> · {c.outcome_label}</span> : null}
          {c.pinned ? <span style={muted}> · pinned</span> : null}
          {c.moved_for_variety ? <span style={muted}> · moved down for variety</span> : null}
          {c.shown_at_other_meal ? <span style={muted}> · shown first at {meal === "lunch" ? "Dinner" : "Lunch"}</span> : null}
          {tier ? <span style={muted}> · {tier}</span> : null}
        </span>
        <span style={muted}>{shownDishes.map((d) => d.name).join(", ") || `${c.dishes.length} dishes`}</span>
      </button>
      {open ? (
        <ul style={{ listStyle: "none", margin: "4px 0 0", padding: "0 8px", display: "grid", gap: 2 }}>
          {c.dishes.map((d, i) => (
            <li key={`${d.menu_item_id}-${i}`} style={{ fontSize: 13, display: "flex", gap: 8 }}>
              <span aria-hidden="true" style={{ width: 14, fontWeight: 800 }}>{d.shown ? "✓" : "–"}</span>
              <span style={{ fontWeight: d.shown ? 700 : 400 }}>{d.name}</span>
              <span style={muted}>{kindLabel(d.type)}{d.pinned ? " · pinned" : ""}{d.why_label ? ` · ${d.why_label}` : ""}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function defaultMeal() {
  const h = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: "America/Los_Angeles" }).format(new Date())) % 24;
  if (h >= 4 && h < 11) return "breakfast";
  if (h >= 11 && h < 16) return "lunch";
  if (h >= 16 && h < 22) return "dinner";
  return "late_night";
}

const inputStyle = { padding: "7px 8px", borderRadius: 10, border: `1px solid ${OWNER_COLORS.line}`, background: "#fff", fontSize: 13 };
const darkBtn = { padding: "8px 18px", borderRadius: 10, border: "none", background: OWNER_COLORS.ink, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" };
const linkStyle = { padding: 0, border: "none", background: "none", color: OWNER_COLORS.accent, fontWeight: 700, cursor: "pointer", fontSize: 13, textDecoration: "none" };
const tabBtn = { padding: "4px 0", border: "none", borderBottom: "2px solid transparent", background: "none", fontWeight: 800, fontSize: 14, cursor: "pointer" };
const rowBtn = { display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", width: "100%", textAlign: "left", padding: "2px 8px", border: "none", background: "none", cursor: "pointer", color: OWNER_COLORS.ink, fontSize: 14 };
