import React, { useCallback, useEffect, useMemo, useState } from "react";
import { EmptyState, OWNER_COLORS, PageCard, SectionTitle } from "./OwnerLayout.jsx";
import {
  assignNutribotTemplates,
  createNutribotTemplate,
  listNutribotTemplates,
  listNutribotUnprocessed,
  searchNutribotIngredients,
} from "../../lib/ownerApi.js";
import { formatDateTime } from "./ownerBotFormat.js";

/**
 * Owner → Bots → Nutribot: items Nutribot could not process (no dish template),
 * assign a template to them (one row or many), the template list, and creating a template.
 * Franchise items never appear here: Nutribot doesn't calculate nutrition for franchises.
 */

// Same look as OwnerScheduledBot.jsx.
const inputStyle = {
  boxSizing: "border-box",
  border: `1px solid ${OWNER_COLORS.line}`,
  borderRadius: 10,
  padding: "9px 12px",
  fontFamily: "inherit",
  fontSize: 14,
  background: "#fff",
};

function primaryButtonStyle({ busy = false, disabled = false } = {}) {
  return {
    border: "none",
    background: OWNER_COLORS.accent,
    color: "#fff",
    borderRadius: 10,
    padding: "10px 18px",
    fontWeight: 700,
    cursor: disabled ? "not-allowed" : busy ? "wait" : "pointer",
    opacity: disabled ? 0.45 : busy ? 0.7 : 1,
    whiteSpace: "nowrap",
  };
}

const secondaryButtonStyle = {
  border: `1px solid ${OWNER_COLORS.line}`,
  background: "#fff",
  borderRadius: 10,
  padding: "9px 16px",
  fontWeight: 700,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const labelStyle = { display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6, color: OWNER_COLORS.ink };
const mutedStyle = { color: OWNER_COLORS.muted, fontSize: 13 };
const errorStyle = { color: "#b91c1c", fontSize: 13 };
const cellStyle = { padding: "8px 10px", verticalAlign: "top", borderTop: `1px solid ${OWNER_COLORS.line}` };
const noticeStyle = { padding: 12, borderRadius: 10, background: "#fff7ed", color: "#9a3412", fontSize: 13 };

const PAGE_SIZE = 50;
const TEMPLATE_OPTIONS_ID = "nutribot-template-options";

const REASON_LABELS = {
  no_keyword_match: "No template keyword in the name or description",
  low_confidence: "Template match too weak to trust",
  category_mismatch: "Matched template didn't fit (drink or dessert name)",
};

const RESULT_TONES = {
  success: { bg: "#dcfce7", fg: "#166534" },
  failed: { bg: "#fee2e2", fg: "#991b1b" },
};
const NEUTRAL_TONE = { bg: "#fef3c7", fg: "#92400e" };

/** Level values the nutrition engine understands (templatePriors.js). */
const LEVEL_OPTIONS = [
  ["low", "Low"],
  ["moderate", "Moderate"],
  ["high", "High"],
  ["very_high", "Very high"],
  ["zero", "Zero (water, black coffee)"],
  ["light_beverage", "Light drink (soda, lemonade)"],
  ["milk_beverage", "Milk drink (latte, chai)"],
  ["protein_beverage", "Protein drink"],
  ["alcohol_wine", "Wine"],
  ["alcohol_cocktail", "Cocktail"],
];

const MACRO_FIELDS = [
  ["calorie_density_level", "Calorie density"],
  ["protein_level", "Protein"],
  ["carb_level", "Carbs"],
  ["fat_level", "Fat"],
  ["fiber_level", "Fiber"],
  ["sodium_level", "Sodium"],
  ["sugar_level", "Sugar"],
];

function templateOptionLabel(t) {
  return `${t.name} (${t.slug})`;
}

/** Template picked in a row input: "Name (slug)", a slug, or an exact name. */
function resolveTemplateChoice(text, templates) {
  const s = String(text || "").trim();
  if (!s) return null;
  const slugMatch = s.match(/\(([a-z0-9_]+)\)\s*$/);
  const slug = slugMatch ? slugMatch[1] : s.toLowerCase();
  return (
    templates.find((t) => t.slug === slug) ||
    templates.find((t) => t.name.toLowerCase() === s.toLowerCase()) ||
    null
  );
}

function restaurantLabel(r) {
  if (!r) return "";
  return `${r.name || `#${r.id}`}${r.city ? ` · ${r.city}${r.state ? `, ${r.state}` : ""}` : ""}`;
}

function Pill({ tone, children }) {
  return (
    <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700, background: tone.bg, color: tone.fg }}>
      {children}
    </span>
  );
}

async function loadAllTemplates() {
  const all = [];
  for (let offset = 0; offset < 5000; offset += 500) {
    const data = await listNutribotTemplates({ limit: 500, offset });
    all.push(...(data.templates || []));
    if (all.length >= (data.total || 0) || !(data.templates || []).length) break;
  }
  return all;
}

// ── Unprocessed items ───────────────────────────────────────────────────────

function AssignResults({ results }) {
  if (!results?.length) return null;
  return (
    <div style={{ marginTop: 12, display: "grid", gap: 6 }}>
      <div style={{ ...labelStyle, marginBottom: 0 }}>Last assignment</div>
      {results.map((r) => (
        <div key={r.menu_item_id} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", fontSize: 13 }}>
          <Pill tone={RESULT_TONES[r.ok ? "success" : r.assigned ? "neutral" : "failed"] || NEUTRAL_TONE}>
            {r.ok ? "Done" : r.assigned ? "Assigned" : "Not assigned"}
          </Pill>
          <span style={{ fontWeight: 700 }}>{r.name || `#${r.menu_item_id}`}</span>
          <span style={mutedStyle}>→ {r.template?.name || r.template?.slug || `template #${r.template?.id}`}</span>
          <span>
            {r.message}
            {r.calories_est != null ? ` (${Math.round(r.calories_est)} cal)` : ""}
          </span>
        </div>
      ))}
    </div>
  );
}

function UnprocessedItems({ templates, templatesReady }) {
  const [restaurantId, setRestaurantId] = useState("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [offset, setOffset] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(() => new Set());
  const [rowChoice, setRowChoice] = useState({});
  const [bulkChoice, setBulkChoice] = useState("");
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState(null);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const next = await listNutribotUnprocessed({ restaurantId, q: query, limit: PAGE_SIZE, offset });
      setData(next);
      setError("");
    } catch (err) {
      setError(err?.message || "Could not load unprocessed items");
    } finally {
      setLoading(false);
    }
  }, [restaurantId, query, offset]);

  useEffect(() => { load(); }, [load]);

  const items = data?.items || [];
  const total = data?.total || 0;
  const allOnPageSelected = items.length > 0 && items.every((i) => selected.has(i.menu_item_id));

  function toggle(id) {
    setSelected((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function togglePage() {
    setSelected((cur) => {
      const next = new Set(cur);
      if (allOnPageSelected) items.forEach((i) => next.delete(i.menu_item_id));
      else items.forEach((i) => next.add(i.menu_item_id));
      return next;
    });
  }

  async function assign(assignments) {
    if (!assignments.length) return;
    setBusy(true);
    setMessage("");
    try {
      const res = await assignNutribotTemplates(assignments);
      setResults(res.results || []);
      const done = (res.results || []).filter((r) => r.ok).length;
      setMessage(`${done} of ${assignments.length} item${assignments.length === 1 ? "" : "s"} now have nutrition.`);
      setSelected(new Set());
      setRowChoice({});
      await load();
    } catch (err) {
      setMessage(err?.payload?.errors?.join("; ") || err?.message || "Could not assign templates");
    } finally {
      setBusy(false);
    }
  }

  function assignRow(item) {
    const template = resolveTemplateChoice(rowChoice[item.menu_item_id], templates);
    if (!template) {
      setMessage(`Pick a template from the list for "${item.name}".`);
      return;
    }
    assign([{ menu_item_id: item.menu_item_id, template_id: template.id }]);
  }

  function assignSelected() {
    const template = resolveTemplateChoice(bulkChoice, templates);
    if (!template) {
      setMessage("Pick a template from the list to assign to the selected items.");
      return;
    }
    assign([...selected].slice(0, 50).map((id) => ({ menu_item_id: id, template_id: template.id })));
  }

  return (
    <div>
      {data && data.ready === false ? (
        <div style={{ ...noticeStyle, marginBottom: 12 }}>
          The unprocessed-items list isn&apos;t set up on the server yet (migration 0362). Nothing else is affected.
        </div>
      ) : null}

      <form
        onSubmit={(e) => { e.preventDefault(); setOffset(0); setQuery(search.trim()); }}
        style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 12 }}
      >
        <div style={{ flex: "1 1 240px" }}>
          <label style={labelStyle} htmlFor="nutribot-unprocessed-restaurant">Restaurant</label>
          <select
            id="nutribot-unprocessed-restaurant"
            style={{ ...inputStyle, width: "100%" }}
            value={restaurantId}
            onChange={(e) => { setRestaurantId(e.target.value); setOffset(0); }}
          >
            <option value="">All restaurants</option>
            {restaurantId && !(data?.restaurants || []).some((r) => String(r.id) === String(restaurantId)) ? (
              <option value={restaurantId}>Restaurant #{restaurantId} (none left)</option>
            ) : null}
            {(data?.restaurants || []).map((r) => (
              <option key={r.id} value={r.id}>{restaurantLabel(r)} ({r.item_count})</option>
            ))}
          </select>
        </div>
        <div style={{ flex: "1 1 200px" }}>
          <label style={labelStyle} htmlFor="nutribot-unprocessed-search">Item name</label>
          <input
            id="nutribot-unprocessed-search"
            style={{ ...inputStyle, width: "100%" }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items"
          />
        </div>
        <button type="submit" style={secondaryButtonStyle}>Search</button>
      </form>

      {selected.size ? (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 12, padding: 12, borderRadius: 10, background: OWNER_COLORS.accentSoft }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>{selected.size} selected</span>
          <input
            aria-label="Template for selected items"
            list={TEMPLATE_OPTIONS_ID}
            style={{ ...inputStyle, flex: "1 1 260px" }}
            value={bulkChoice}
            onChange={(e) => setBulkChoice(e.target.value)}
            placeholder={templatesReady ? "Type to pick a template" : "Loading templates…"}
          />
          <button type="button" onClick={assignSelected} disabled={busy} style={primaryButtonStyle({ busy })}>
            {busy ? "Assigning…" : `Assign to ${Math.min(selected.size, 50)} selected`}
          </button>
          <button type="button" style={secondaryButtonStyle} onClick={() => setSelected(new Set())}>Clear</button>
          {selected.size > 50 ? <span style={mutedStyle}>Up to 50 at a time.</span> : null}
        </div>
      ) : null}

      {message ? <div style={{ marginBottom: 12, fontSize: 13, fontWeight: 700 }}>{message}</div> : null}
      {error ? <div style={{ ...errorStyle, marginBottom: 12 }}>{error}</div> : null}

      {loading && !data ? (
        <EmptyState>Loading…</EmptyState>
      ) : !items.length ? (
        <EmptyState>
          {query || restaurantId ? "No unprocessed items match." : "No unprocessed items. Items appear here after Nutribot runs and can't find a template."}
        </EmptyState>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: "left", color: OWNER_COLORS.muted }}>
                <th style={{ padding: "8px 10px 8px 0" }}>
                  <input type="checkbox" aria-label="Select all on this page" checked={allOnPageSelected} onChange={togglePage} />
                </th>
                <th style={{ padding: "8px 10px" }}>Item</th>
                <th style={{ padding: "8px 10px" }}>Restaurant</th>
                <th style={{ padding: "8px 10px" }}>Why</th>
                <th style={{ padding: "8px 10px", minWidth: 280 }}>Template</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.menu_item_id}>
                  <td style={{ ...cellStyle, paddingLeft: 0 }}>
                    <input
                      type="checkbox"
                      aria-label={`Select ${item.name}`}
                      checked={selected.has(item.menu_item_id)}
                      onChange={() => toggle(item.menu_item_id)}
                    />
                  </td>
                  <td style={cellStyle}>
                    <div style={{ fontWeight: 700 }}>{item.name}</div>
                    {item.section ? <div style={mutedStyle}>{item.section}</div> : null}
                    {item.description ? <div style={{ ...mutedStyle, maxWidth: 360 }}>{item.description}</div> : null}
                  </td>
                  <td style={cellStyle}>{restaurantLabel(item.restaurant) || "—"}</td>
                  <td style={cellStyle}>
                    <div>{REASON_LABELS[item.reason] || item.reason}</div>
                    {item.template_tried ? <div style={mutedStyle}>Tried: {item.template_tried.slug}</div> : null}
                    <div style={mutedStyle}>
                      Last tried {formatDateTime(item.last_attempted_at)}
                      {item.attempts > 1 ? ` · ${item.attempts} tries` : ""}
                    </div>
                  </td>
                  <td style={cellStyle}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <input
                        aria-label={`Template for ${item.name}`}
                        list={TEMPLATE_OPTIONS_ID}
                        style={{ ...inputStyle, flex: "1 1 200px", padding: "7px 10px" }}
                        value={rowChoice[item.menu_item_id] || ""}
                        onChange={(e) => setRowChoice((cur) => ({ ...cur, [item.menu_item_id]: e.target.value }))}
                        placeholder="Type to pick"
                      />
                      <button
                        type="button"
                        style={{ ...secondaryButtonStyle, padding: "7px 12px" }}
                        disabled={busy || !rowChoice[item.menu_item_id]}
                        onClick={() => assignRow(item)}
                      >
                        Assign
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > PAGE_SIZE ? (
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12 }}>
          <button type="button" style={secondaryButtonStyle} disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}>Previous</button>
          <span style={mutedStyle}>
            {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total.toLocaleString()}
          </span>
          <button type="button" style={secondaryButtonStyle} disabled={offset + PAGE_SIZE >= total} onClick={() => setOffset(offset + PAGE_SIZE)}>Next</button>
        </div>
      ) : total ? (
        <div style={{ ...mutedStyle, marginTop: 10 }}>{total.toLocaleString()} item{total === 1 ? "" : "s"}</div>
      ) : null}

      <AssignResults results={results} />
    </div>
  );
}

// ── Templates ───────────────────────────────────────────────────────────────

function TemplateList({ refreshKey }) {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    listNutribotTemplates({ q: query, limit: 100 })
      .then((d) => { if (!cancelled) { setData(d); setError(""); } })
      .catch((err) => { if (!cancelled) setError(err?.message || "Could not load templates"); });
    return () => { cancelled = true; };
  }, [query, refreshKey]);

  const templates = data?.templates || [];
  return (
    <div>
      <form onSubmit={(e) => { e.preventDefault(); setQuery(search.trim()); }} style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <input
          aria-label="Search templates"
          style={{ ...inputStyle, flex: "1 1 260px" }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, category or keyword"
        />
        <button type="submit" style={secondaryButtonStyle}>Search</button>
      </form>
      {error ? <div style={errorStyle}>{error}</div> : null}
      {!data && !error ? <EmptyState>Loading…</EmptyState> : null}
      {data && !templates.length ? <EmptyState>No templates match.</EmptyState> : null}
      {templates.length ? (
        <div style={{ overflowX: "auto", maxHeight: 420, overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: "left", color: OWNER_COLORS.muted }}>
                <th style={{ padding: "8px 10px 8px 0" }}>Template</th>
                <th style={{ padding: "8px 10px" }}>Category</th>
                <th style={{ padding: "8px 10px" }}>Portion</th>
                <th style={{ padding: "8px 10px" }}>Keywords</th>
                <th style={{ padding: "8px 10px" }}>Ingredient rules</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((t) => (
                <tr key={t.id}>
                  <td style={{ ...cellStyle, paddingLeft: 0 }}>
                    <div style={{ fontWeight: 700 }}>{t.name}</div>
                    <div style={mutedStyle}>{t.slug}</div>
                  </td>
                  <td style={cellStyle}>{[t.category, t.cuisine].filter(Boolean).join(" · ") || "—"}</td>
                  <td style={cellStyle}>{t.portion_oz?.typical != null ? `${t.portion_oz.typical} oz` : "—"}</td>
                  <td style={cellStyle}>{t.keyword_count}</td>
                  <td style={cellStyle}>{t.ingredient_rule_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {data && data.total > templates.length ? (
        <div style={{ ...mutedStyle, marginTop: 8 }}>
          Showing {templates.length} of {data.total.toLocaleString()}. Search to narrow it down.
        </div>
      ) : null}
    </div>
  );
}

const EMPTY_FORM = {
  name: "",
  category: "",
  cuisine: "",
  portion_min: "",
  portion_typical: "",
  portion_max: "",
  levels: Object.fromEntries(MACRO_FIELDS.map(([f]) => [f, ""])),
  keywords: "",
  rules: [],
};

function buildTemplateBody(form) {
  return {
    name: form.name,
    category: form.category,
    cuisine: form.cuisine || undefined,
    portion_oz: { min: form.portion_min, typical: form.portion_typical, max: form.portion_max },
    macro_levels: form.levels,
    keywords: form.keywords.split(/[\n,]/).map((k) => k.trim()).filter(Boolean),
    ingredient_rules: form.rules.map((r) => ({ ingredient_id: r.ingredient_id, default_grams: r.default_grams })),
  };
}

function PreviewBucket({ title, bucket }) {
  if (!bucket?.count) return null;
  return (
    <div style={{ fontSize: 13 }}>
      <span style={{ fontWeight: 700 }}>{bucket.count}</span> {title}
      <span style={mutedStyle}>
        {" "}— {bucket.sample.slice(0, 5).map((s) => s.name).join(", ")}
        {bucket.count > 5 ? ", …" : ""}
      </span>
    </div>
  );
}

function TemplatePreview({ preview }) {
  if (!preview) return null;
  const cap = preview.would_capture || {};
  const anything = ["unprocessed", "unassigned", "competing", "rejected_by_trust_check"].some((k) => cap[k]?.count);
  return (
    <div style={{ marginTop: 12, padding: 14, borderRadius: 12, border: `1px solid ${OWNER_COLORS.line}`, background: "#fff", display: "grid", gap: 6 }}>
      <div style={{ fontWeight: 700 }}>What these keywords would match</div>
      {!anything ? <div style={mutedStyle}>No current menu items would match these keywords.</div> : null}
      <PreviewBucket title="unprocessed items would get this template" bucket={cap.unprocessed} />
      <PreviewBucket title="items with no template yet would get it" bucket={cap.unassigned} />
      <PreviewBucket title="items already on another template would score higher here (they keep their template)" bucket={cap.competing} />
      <PreviewBucket title="items would match but fail the trust check" bucket={cap.rejected_by_trust_check} />
      {preview.scan_truncated ? <div style={mutedStyle}>Only the first {preview.scanned.toLocaleString()} matching items were checked.</div> : null}
      {(preview.warnings || []).map((w, i) => (
        <div key={i} style={{ fontSize: 13, color: w.severity === "critical" ? "#b91c1c" : w.severity === "high" ? "#9a3412" : OWNER_COLORS.muted }}>
          {w.severity === "critical" ? "Critical: " : w.severity === "high" ? "Warning: " : "Note: "}
          {w.message}
        </div>
      ))}
    </div>
  );
}

function IngredientRules({ rules, onChange }) {
  const [search, setSearch] = useState("");
  const [found, setFound] = useState(null);
  const [error, setError] = useState("");

  async function find(e) {
    e?.preventDefault();
    const q = search.trim();
    if (q.length < 2) return;
    try {
      const data = await searchNutribotIngredients(q);
      setFound(data.ingredients || []);
      setError("");
    } catch (err) {
      setError(err?.message || "Ingredient search failed");
    }
  }

  function add(ing) {
    if (rules.some((r) => r.ingredient_id === ing.id)) return;
    onChange([...rules, { ingredient_id: ing.id, name: ing.name, default_grams: "" }]);
    setFound(null);
    setSearch("");
  }

  return (
    <div>
      <label style={labelStyle} htmlFor="nutribot-ingredient-search">Ingredient rules (at least one)</label>
      {rules.map((r, i) => (
        <div key={r.ingredient_id} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
          <span style={{ flex: "1 1 200px", fontSize: 14 }}>{r.name} <span style={mutedStyle}>#{r.ingredient_id}</span></span>
          <input
            aria-label={`Grams of ${r.name}`}
            type="number"
            min="1"
            step="any"
            style={{ ...inputStyle, width: 110 }}
            value={r.default_grams}
            onChange={(e) => onChange(rules.map((x, j) => (j === i ? { ...x, default_grams: e.target.value } : x)))}
            placeholder="grams"
          />
          <button type="button" style={{ ...secondaryButtonStyle, padding: "7px 12px" }} onClick={() => onChange(rules.filter((_, j) => j !== i))}>
            Remove
          </button>
        </div>
      ))}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          id="nutribot-ingredient-search"
          style={{ ...inputStyle, flex: "1 1 220px" }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") find(e); }}
          placeholder="Search ingredients"
        />
        <button type="button" style={secondaryButtonStyle} onClick={find} disabled={search.trim().length < 2}>Find</button>
      </div>
      {error ? <div style={{ ...errorStyle, marginTop: 6 }}>{error}</div> : null}
      {found ? (
        <div style={{ marginTop: 8, display: "grid", gap: 4 }}>
          {!found.length ? <div style={mutedStyle}>No ingredients found.</div> : null}
          {found.map((ing) => (
            <button key={ing.id} type="button" onClick={() => add(ing)} style={{ ...secondaryButtonStyle, textAlign: "left", fontWeight: 400 }}>
              <span style={{ fontWeight: 700 }}>{ing.name}</span>{" "}
              <span style={mutedStyle}>#{ing.id}{ing.category ? ` · ${ing.category}` : ""}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function CreateTemplateForm({ onCreated, onCancel }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState("");
  const [errors, setErrors] = useState([]);
  const [preview, setPreview] = useState(null);
  const [needsAck, setNeedsAck] = useState(false);

  const set = (patch) => {
    setForm((cur) => ({ ...cur, ...patch }));
    setNeedsAck(false);
  };

  async function submit({ dryRun = false, acknowledge = false } = {}) {
    setBusy(dryRun ? "preview" : "save");
    setErrors([]);
    try {
      const res = await createNutribotTemplate({
        ...buildTemplateBody(form),
        dry_run: dryRun,
        acknowledge_warnings: acknowledge,
      });
      setPreview(res.preview || null);
      if (!dryRun) {
        onCreated?.(res.template);
        setForm(EMPTY_FORM);
        setPreview(null);
      }
    } catch (err) {
      const p = err?.payload || {};
      if (p.code === "critical_warnings") {
        setPreview(p.preview || null);
        setNeedsAck(true);
        setErrors([p.error]);
      } else {
        setErrors(p.errors?.length ? p.errors : [err?.message || "Could not save the template"]);
      }
    } finally {
      setBusy("");
    }
  }

  const twoCol = { display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" };

  return (
    <div style={{ display: "grid", gap: 14, padding: 16, borderRadius: 12, border: `1px solid ${OWNER_COLORS.line}`, background: OWNER_COLORS.page }}>
      <div style={twoCol}>
        <div>
          <label style={labelStyle} htmlFor="nutribot-template-name">Name</label>
          <input id="nutribot-template-name" style={{ ...inputStyle, width: "100%" }} value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="Birria Taco" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="nutribot-template-category">Category</label>
          <input id="nutribot-template-category" style={{ ...inputStyle, width: "100%" }} value={form.category} onChange={(e) => set({ category: e.target.value })} placeholder="taco" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="nutribot-template-cuisine">Cuisine (optional)</label>
          <input id="nutribot-template-cuisine" style={{ ...inputStyle, width: "100%" }} value={form.cuisine} onChange={(e) => set({ cuisine: e.target.value })} placeholder="mexican" />
        </div>
      </div>

      <div>
        <div style={labelStyle}>Portion (ounces)</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[["portion_min", "Smallest"], ["portion_typical", "Typical"], ["portion_max", "Largest"]].map(([key, label]) => (
            <input
              key={key}
              aria-label={`${label} portion in ounces`}
              type="number"
              min="0.1"
              step="any"
              style={{ ...inputStyle, width: 130 }}
              value={form[key]}
              onChange={(e) => set({ [key]: e.target.value })}
              placeholder={label}
            />
          ))}
        </div>
      </div>

      <div>
        <div style={labelStyle}>Macro levels</div>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
          {MACRO_FIELDS.map(([field, label]) => (
            <label key={field} style={{ fontSize: 13 }}>
              <span style={{ display: "block", marginBottom: 4, color: OWNER_COLORS.muted }}>{label}</span>
              <select
                style={{ ...inputStyle, width: "100%" }}
                value={form.levels[field]}
                onChange={(e) => set({ levels: { ...form.levels, [field]: e.target.value } })}
              >
                <option value="">Choose…</option>
                {LEVEL_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label style={labelStyle} htmlFor="nutribot-template-keywords">Keywords (one per line or comma-separated)</label>
        <textarea
          id="nutribot-template-keywords"
          rows={3}
          style={{ ...inputStyle, width: "100%", resize: "vertical" }}
          value={form.keywords}
          onChange={(e) => set({ keywords: e.target.value })}
          placeholder={"birria\nbirria taco"}
        />
        <div style={{ ...mutedStyle, marginTop: 4 }}>
          Items whose name or description contains a keyword can match this template. Use Preview to check what they would catch.
        </div>
      </div>

      <IngredientRules rules={form.rules} onChange={(rules) => set({ rules })} />

      {errors.length ? (
        <div style={{ display: "grid", gap: 2 }}>
          {errors.map((e, i) => <div key={i} style={errorStyle}>{e}</div>)}
        </div>
      ) : null}

      <TemplatePreview preview={preview} />

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" style={secondaryButtonStyle} disabled={Boolean(busy)} onClick={() => submit({ dryRun: true })}>
          {busy === "preview" ? "Checking…" : "Preview"}
        </button>
        {needsAck ? (
          <button type="button" style={primaryButtonStyle({ busy: busy === "save" })} disabled={Boolean(busy)} onClick={() => submit({ acknowledge: true })}>
            {busy === "save" ? "Saving…" : "Save anyway"}
          </button>
        ) : (
          <button type="button" style={primaryButtonStyle({ busy: busy === "save" })} disabled={Boolean(busy)} onClick={() => submit()}>
            {busy === "save" ? "Saving…" : "Save template"}
          </button>
        )}
        <button type="button" style={secondaryButtonStyle} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

// ── Section ─────────────────────────────────────────────────────────────────

export default function NutribotTemplatesPanel() {
  const [templates, setTemplates] = useState([]);
  const [templatesReady, setTemplatesReady] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(null);

  useEffect(() => {
    let cancelled = false;
    loadAllTemplates()
      .then((all) => { if (!cancelled) { setTemplates(all); setTemplatesReady(true); } })
      .catch(() => { if (!cancelled) setTemplatesReady(true); });
    return () => { cancelled = true; };
  }, [refreshKey]);

  const options = useMemo(() => templates.map((t) => <option key={t.id} value={templateOptionLabel(t)} />), [templates]);

  return (
    <>
      <datalist id={TEMPLATE_OPTIONS_ID}>{options}</datalist>

      <PageCard style={{ padding: 24 }}>
        <SectionTitle
          title="Unprocessed items"
          subtitle="Items Nutribot couldn't calculate because no dish template fit. Pick a template for an item (or select several) and Nutribot recalculates just those items. Franchise items are never listed: their nutrition comes from the franchise."
        />
        <UnprocessedItems templates={templates} templatesReady={templatesReady} />
      </PageCard>

      <PageCard style={{ padding: 24 }}>
        <SectionTitle
          title="Dish templates"
          subtitle="The templates Nutribot matches menu items to. New templates are used for new menu items on the next run."
          action={
            creating ? null : (
              <button type="button" style={primaryButtonStyle()} onClick={() => { setCreating(true); setCreated(null); }}>
                Create template
              </button>
            )
          }
        />
        {created ? (
          <div style={{ marginBottom: 12, fontSize: 13, fontWeight: 700 }}>
            Saved {created.name} ({created.slug}). It is now in the template picker.
          </div>
        ) : null}
        {creating ? (
          <div style={{ marginBottom: 16 }}>
            <CreateTemplateForm
              onCreated={(t) => { setCreated(t); setCreating(false); setRefreshKey((k) => k + 1); }}
              onCancel={() => setCreating(false)}
            />
          </div>
        ) : null}
        <TemplateList refreshKey={refreshKey} />
      </PageCard>
    </>
  );
}
