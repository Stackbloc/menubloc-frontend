import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import OwnerLayout, { OWNER_COLORS, PageCard, EmptyState } from "./OwnerLayout.jsx";
import {
  getOwnerMimsFacets,
  searchOwnerMimsItems,
  getOwnerMimsItem,
  updateOwnerMimsItem,
  getOwnerMimsItemChanges,
  undoOwnerMimsItemChange,
} from "../../lib/ownerApi.js";

/**
 * Owner → Menu Items (MIMS v1, plan 65 MIMS-1). Created 2026-11-19.
 * System-wide menu item catalog: search, filters, grid, and a read-only item inspector.
 * One row = one location dish (Common Knowledge row). Filters live in the URL so a view can be shared.
 * MIMS-2 (2026-11-19): edit one dish (name, section, description, price, availability, review), see its edit log,
 * undo an edit. Every save goes through the backend write adapter (mimsWriteAdapter.js), never straight to tables.
 */

const FILTER_KEYS = [
  "q", "chain_id", "cluster_id", "market_id", "city", "state", "kind", "price_min", "price_max",
  "no_price", "calories", "classified", "needs_review", "menu_status", "location", "sort", "page", "view", "metro_id",
];

// MIMS-2b (2026-11-19): chain dishes are one row under the chain; store copies hidden unless asked for.
const ROW_KIND_TEXT = { chain_dish: "Chain dish", store_only: "Store-only dish", store_copy: "Store copy", dish: "Independent dish" };

function storesLine(chain) {
  if (!chain) return null;
  const bits = [`${chain.store_count.toLocaleString()} store${chain.store_count === 1 ? "" : "s"}`];
  if (chain.price_differs) bits.push(`${chain.price_differs} price${chain.price_differs === 1 ? "" : "s"} differ`);
  if (chain.not_sold) bits.push(`not sold at ${chain.not_sold}`);
  return bits.join(" · ");
}

const C = OWNER_COLORS;
const PROBLEM_TEXT = {
  no_restaurant: "No restaurant",
  restaurant_inactive: "Restaurant inactive",
  location_merged: "Location merged",
  location_closed: "Location closed",
  location_retired_duplicate: "Location retired",
};

const inputStyle = {
  height: 34,
  padding: "0 10px",
  border: `1px solid ${C.line}`,
  borderRadius: 8,
  background: "#fff",
  color: C.ink,
  fontSize: 13,
  minWidth: 0,
};

const buttonStyle = {
  height: 32,
  padding: "0 12px",
  border: `1px solid ${C.line}`,
  borderRadius: 8,
  background: "#fff",
  color: C.ink,
  fontSize: 13,
  cursor: "pointer",
};

function money(v) {
  if (v === null || v === undefined || v === "") return "—";
  const n = Number(v);
  return Number.isFinite(n) ? `$${n.toFixed(2)}` : "—";
}

function minorMoney(v) {
  if (v === null || v === undefined) return "—";
  return `$${(Number(v) / 100).toFixed(2)}`;
}

function when(v) {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function Select({ label, value, onChange, children, width = 150 }) {
  return (
    <label style={{ display: "grid", gap: 4, fontSize: 11, color: C.muted, width }}>
      {label}
      <select value={value || ""} onChange={(e) => onChange(e.target.value)} style={inputStyle}>
        {children}
      </select>
    </label>
  );
}

function Text({ label, value, onChange, width = 120, placeholder, type = "text" }) {
  return (
    <label style={{ display: "grid", gap: 4, fontSize: 11, color: C.muted, width }}>
      {label}
      <input type={type} value={value || ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} style={inputStyle} />
    </label>
  );
}

function Filters({ params, setParam, facets, onClear }) {
  const [q, setQ] = useState(params.q || "");
  const [urlQ, setUrlQ] = useState(params.q || "");
  const timer = useRef(null);
  // Follow the URL when it changes from outside (Clear, back button), without fighting the typing.
  if ((params.q || "") !== urlQ) {
    setUrlQ(params.q || "");
    if ((params.q || "") !== q.trim()) setQ(params.q || "");
  }
  const typeQ = (v) => {
    setQ(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setParam("q", v.trim()), 350);
  };
  const f = facets || {};

  return (
    <PageCard style={{ padding: 16 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
        <label style={{ display: "grid", gap: 4, fontSize: 11, color: C.muted, flex: "1 1 260px", minWidth: 200 }}>
          Search dish name or item ID
          <input
            value={q}
            onChange={(e) => typeQ(e.target.value)}
            placeholder="e.g. spicy noodles"
            style={{ ...inputStyle, width: "100%" }}
            aria-label="Search dish name or item ID"
          />
        </label>
        <Select label="Chain" value={params.chain_id} onChange={(v) => setParam("chain_id", v)} width={170}>
          <option value="">All chains</option>
          {(f.chains || []).map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
        <Select label="Cluster" value={params.cluster_id} onChange={(v) => setParam("cluster_id", v)} width={170}>
          <option value="">All clusters</option>
          {(f.clusters || []).map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
        {/* Metro (2026-11-19): replaces Market; a restaurant is in a metro by its map location. Los Angeles is the default. */}
        <Select
          label="Metro"
          value={params.metro_id || (f.default_metro_id ? String(f.default_metro_id) : "all")}
          onChange={(v) => setParam("metro_id", f.default_metro_id && String(f.default_metro_id) === v ? "" : v)}
          width={160}
        >
          <option value="all">All metros</option>
          {(f.metros || []).map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </Select>
        <Text label="City" value={params.city} onChange={(v) => setParam("city", v)} width={130} />
        <Select label="State" value={params.state} onChange={(v) => setParam("state", v)} width={90}>
          <option value="">All</option>
          {(f.states || []).map((s) => (
            <option key={s.state} value={s.state}>{s.state}</option>
          ))}
        </Select>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end", marginTop: 12 }}>
        <Select label="Type" value={params.kind} onChange={(v) => setParam("kind", v)} width={150}>
          <option value="">All</option>
          <option value="independent">Independent</option>
          <option value="chain">Chain dish</option>
          <option value="store_only">Store-only (chain store)</option>
        </Select>
        <Text label="Price from" type="number" value={params.price_min} onChange={(v) => setParam("price_min", v)} width={90} />
        <Text label="Price to" type="number" value={params.price_max} onChange={(v) => setParam("price_max", v)} width={90} />
        <Select label="Calories" value={params.calories} onChange={(v) => setParam("calories", v)} width={110}>
          <option value="">Any</option>
          <option value="yes">Has calories</option>
          <option value="no">No calories</option>
        </Select>
        <Select label="Classification" value={params.classified} onChange={(v) => setParam("classified", v)} width={140}>
          <option value="">Any</option>
          <option value="yes">Classified</option>
          <option value="low">Low confidence</option>
          <option value="no">Not classified</option>
        </Select>
        <Select label="Location" value={params.location} onChange={(v) => setParam("location", v)} width={150}>
          <option value="">Any</option>
          <option value="inactive">Restaurant inactive</option>
          <option value="missing">No restaurant</option>
        </Select>
        <Select label="Menu status" value={params.menu_status} onChange={(v) => setParam("menu_status", v)} width={120}>
          <option value="">Any</option>
          <option value="visible">Visible</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="hidden">Hidden</option>
          <option value="archived">Archived</option>
        </Select>
        <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 13, color: C.ink, height: 34 }}>
          <input type="checkbox" checked={params.needs_review === "1"} onChange={(e) => setParam("needs_review", e.target.checked ? "1" : "")} />
          Needs review
        </label>
        <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 13, color: C.ink, height: 34 }}>
          <input type="checkbox" checked={params.view === "store_copies"} onChange={(e) => setParam("view", e.target.checked ? "store_copies" : "")} />
          Store copies only
        </label>
        <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 13, color: C.ink, height: 34 }}>
          <input type="checkbox" checked={params.no_price === "1"} onChange={(e) => setParam("no_price", e.target.checked ? "1" : "")} />
          No price
        </label>
        <Select label="Sort" value={params.sort || "newest"} onChange={(v) => setParam("sort", v)} width={130}>
          <option value="newest">Newest</option>
          <option value="updated">Recently updated</option>
          <option value="name">Name A–Z</option>
          <option value="price_low">Price low–high</option>
          <option value="price_high">Price high–low</option>
          <option value="oldest">Oldest</option>
        </Select>
        <button type="button" onClick={onClear} style={buttonStyle}>Clear</button>
      </div>
    </PageCard>
  );
}

const TH = { textAlign: "left", padding: "8px 10px", fontSize: 11, fontWeight: 600, color: C.muted, borderBottom: `1px solid ${C.line}`, whiteSpace: "nowrap" };
const TD = { padding: "9px 10px", fontSize: 13, color: C.ink, borderBottom: `1px solid ${C.line}`, verticalAlign: "top" };

function Grid({ items, selectedId, onOpen }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 980 }}>
        <thead>
          <tr>
            <th style={TH}>Dish</th>
            <th style={TH}>Restaurant</th>
            <th style={TH}>Chain</th>
            <th style={{ ...TH, textAlign: "right" }}>Price</th>
            <th style={{ ...TH, textAlign: "right" }}>Calories</th>
            <th style={TH}>Class</th>
            <th style={TH}>Cuisine</th>
            <th style={TH}>Status</th>
            <th style={TH}>Universal ID</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => {
            const on = String(selectedId) === String(it.id);
            return (
              <tr
                key={it.id}
                onClick={() => onOpen(it.id)}
                onKeyDown={(e) => (e.key === "Enter" ? onOpen(it.id) : null)}
                tabIndex={0}
                style={{ cursor: "pointer", background: on ? C.accentSoft : "transparent" }}
              >
                <td style={TD}>
                  <div style={{ fontWeight: 600 }}>{it.item_name || "(no name)"}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{it.section_name || "—"} · #{it.id}</div>
                </td>
                <td style={TD}>
                  {it.row_kind === "chain_dish" ? (
                    <>
                      <div>{it.chain_name || "Chain"} · all stores</div>
                      <div style={{ fontSize: 11, color: C.muted }}>{storesLine(it.chain)}</div>
                    </>
                  ) : (
                    <>
                      <div>{it.restaurant_name || "—"}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>{[it.city, it.state].filter(Boolean).join(", ") || "—"}</div>
                    </>
                  )}
                  {it.row_kind === "store_only" || it.row_kind === "store_copy" ? (
                    <div style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>{ROW_KIND_TEXT[it.row_kind]}</div>
                  ) : null}
                  {it.row_kind !== "chain_dish" && it.location_problem ? (
                    <div style={{ fontSize: 11, color: "#b42318", fontWeight: 600 }}>{PROBLEM_TEXT[it.location_problem] || it.location_problem}</div>
                  ) : null}
                </td>
                <td style={TD}>{it.chain_name || "Independent"}</td>
                <td style={{ ...TD, textAlign: "right" }}>{money(it.row_kind === "chain_dish" ? it.chain?.chain_price : it.price)}</td>
                <td style={{ ...TD, textAlign: "right" }}>{it.calories_kcal === null ? "—" : Math.round(it.calories_kcal)}</td>
                <td style={TD}>
                  {it.mks_code ? (
                    <>
                      <div>{it.mks_code}</div>
                      <div style={{ fontSize: 11, color: it.mks_confidence !== null && it.mks_confidence < 0.6 ? "#b42318" : C.muted }}>
                        {it.mks_confidence === null ? "" : `${Math.round(it.mks_confidence * 100)}% · `}{it.mks_status || ""}
                      </div>
                    </>
                  ) : (
                    <span style={{ color: C.muted }}>—</span>
                  )}
                </td>
                <td style={TD}>{it.cuisine || "—"}</td>
                <td style={TD}>
                  <div>{it.menu_status || "—"}</div>
                  {it.needs_review ? <div style={{ fontSize: 11, color: "#b54708", fontWeight: 600 }}>Needs review</div> : null}
                </td>
                <td style={{ ...TD, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 12 }}>{it.universal_id || "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );
}

function Fields({ rows }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(110px, 38%) 1fr", gap: "6px 12px", fontSize: 13 }}>
      {rows.map(([k, v]) => (
        <React.Fragment key={k}>
          <div style={{ color: C.muted }}>{k}</div>
          <div style={{ color: C.ink, wordBreak: "break-word" }}>{v === null || v === undefined || v === "" ? "—" : v}</div>
        </React.Fragment>
      ))}
    </div>
  );
}

function MiniTable({ cols, rows, empty }) {
  if (!rows || !rows.length) return <div style={{ fontSize: 13, color: C.muted }}>{empty}</div>;
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>{cols.map((c) => <th key={c[0]} style={{ ...TH, padding: "6px 8px" }}>{c[0]}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>{cols.map((c) => <td key={c[0]} style={{ ...TD, padding: "6px 8px", fontSize: 12 }}>{c[1](r) ?? "—"}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const FIELD_LABELS = {
  item_name: "Name",
  section_name: "Section",
  description: "Description",
  price: "Price",
  menu_status: "Availability",
  needs_review: "Needs review",
  review_notes: "Review notes",
};

function showValue(field, v) {
  if (v === null || v === undefined || v === "") return "—";
  if (field === "price") return money(v);
  if (field === "needs_review") return v ? "Yes" : "No";
  return String(v);
}

const fieldBox = { ...inputStyle, width: "100%", boxSizing: "border-box" };

function formFrom(it) {
  return {
    item_name: it.item_name || "",
    section_name: it.section_name || "",
    description: it.description || "",
    price: it.price === null || it.price === undefined ? "" : Number(it.price).toFixed(2),
    menu_status: it.menu_status || "",
    needs_review: Boolean(it.needs_review),
    review_notes: it.review_notes || "",
  };
}

function EditForm({ item, onSaved, onCancel }) {
  const franchise = Boolean(item.is_franchise_menu_item);
  const start = useMemo(() => formFrom(item), [item]);
  const [form, setForm] = useState(start);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState(null);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const changed = Object.keys(form).filter((k) => {
    if (franchise && k !== "needs_review" && k !== "review_notes") return false;
    return String(form[k]) !== String(start[k]);
  });

  async function save(confirmDuplicate = false) {
    if (!changed.length) return;
    setBusy(true);
    setProblem(null);
    const changes = {};
    for (const k of changed) changes[k] = form[k];
    try {
      await updateOwnerMimsItem(item.id, {
        changes,
        based_on_updated_at: item.updated_at,
        reason: reason.trim() || undefined,
        confirm_duplicate: confirmDuplicate || undefined,
      });
      onSaved();
    } catch (e) {
      setProblem({ message: e.message, code: e.payload?.code, duplicates: e.payload?.duplicates || null });
    } finally {
      setBusy(false);
    }
  }

  const row = (label, el) => (
    <label style={{ display: "grid", gap: 4, fontSize: 12, color: C.muted }}>
      {label}
      {el}
    </label>
  );

  return (
    <div style={{ marginTop: 16, padding: 14, border: `1px solid ${C.line}`, borderRadius: 12, background: "#fbfbfa", display: "grid", gap: 10 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>Edit dish</div>
      {franchise ? (
        <div style={{ fontSize: 12, color: C.muted }}>
          This is a chain store&apos;s copy of the chain dish, so only review fields can change here. Edit the chain menu for name or price.
        </div>
      ) : (
        <>
          {row("Name", <input value={form.item_name} onChange={(e) => set("item_name", e.target.value)} style={fieldBox} />)}
          {row("Section", <input value={form.section_name} onChange={(e) => set("section_name", e.target.value)} style={fieldBox} />)}
          {row(
            "Description",
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} style={{ ...fieldBox, height: "auto", padding: 8 }} />
          )}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <div style={{ width: 120 }}>
              {row("Price ($)", <input inputMode="decimal" value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="none" style={fieldBox} />)}
            </div>
            <div style={{ width: 150 }}>
              {row(
                "Availability",
                <select value={form.menu_status} onChange={(e) => set("menu_status", e.target.value)} style={fieldBox}>
                  {start.menu_status && start.menu_status !== "visible" && start.menu_status !== "hidden" ? (
                    <option value={start.menu_status}>{start.menu_status} (current)</option>
                  ) : null}
                  <option value="visible">Visible</option>
                  <option value="hidden">Hidden</option>
                </select>
              )}
            </div>
          </div>
        </>
      )}
      <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 13, color: C.ink }}>
        <input type="checkbox" checked={form.needs_review} onChange={(e) => set("needs_review", e.target.checked)} />
        Needs review
      </label>
      {row("Review notes", <input value={form.review_notes} onChange={(e) => set("review_notes", e.target.value)} style={fieldBox} />)}
      {row("Why (optional, shown in the edit log)", <input value={reason} maxLength={300} onChange={(e) => setReason(e.target.value)} style={fieldBox} />)}

      {problem ? (
        <div style={{ padding: "10px 12px", borderRadius: 10, background: "#fef3f2", color: "#b42318", fontSize: 13, display: "grid", gap: 8 }}>
          <div>{problem.message}</div>
          {problem.code === "duplicate_warning" && problem.duplicates ? (
            <>
              <div style={{ color: C.ink }}>
                {problem.duplicates.map((x) => `#${x.id} ${x.item_name} (${x.section_name || "no section"}, ${money(x.price)})`).join(" · ")}
              </div>
              <div>
                <button type="button" style={buttonStyle} disabled={busy} onClick={() => save(true)}>
                  Save anyway
                </button>
              </div>
            </>
          ) : null}
        </div>
      ) : null}

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button
          type="button"
          onClick={() => save(false)}
          disabled={busy || !changed.length}
          style={{ ...buttonStyle, background: C.ink, color: "#fff", borderColor: C.ink, opacity: busy || !changed.length ? 0.5 : 1 }}
        >
          {busy ? "Saving…" : changed.length ? `Save ${changed.length} change${changed.length === 1 ? "" : "s"}` : "No changes"}
        </button>
        <button type="button" onClick={onCancel} style={buttonStyle} disabled={busy}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function EditLog({ itemId, changes, onUndone }) {
  const [busyId, setBusyId] = useState(null);
  const [problem, setProblem] = useState(null);
  if (!changes) return <div style={{ fontSize: 13, color: C.muted }}>Loading…</div>;
  if (!changes.length) return <div style={{ fontSize: 13, color: C.muted }}>No edits made in Menu Items yet.</div>;

  async function undo(changeId) {
    setBusyId(changeId);
    setProblem(null);
    try {
      await undoOwnerMimsItemChange(itemId, changeId);
      onUndone();
    } catch (e) {
      setProblem(e.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div style={{ display: "grid", gap: 8 }}>
      {problem ? <div style={{ fontSize: 13, color: "#b42318" }}>{problem}</div> : null}
      {changes.map((c) => (
        <div key={c.id} style={{ padding: "8px 10px", border: `1px solid ${C.line}`, borderRadius: 10, fontSize: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, color: C.muted }}>
            <span>
              {when(c.created_at)} · {c.actor_email || "owner"}
              {c.undo_of ? ` · undo of #${c.undo_of}` : ""}
            </span>
            {!c.undo_of && !c.undone_at ? (
              <button type="button" style={{ ...buttonStyle, height: 24, padding: "0 8px", fontSize: 12 }} disabled={busyId === c.id} onClick={() => undo(c.id)}>
                {busyId === c.id ? "Undoing…" : "Undo"}
              </button>
            ) : c.undone_at ? (
              <span>Undone</span>
            ) : null}
          </div>
          {Object.entries(c.changes || {}).map(([f, v]) => (
            <div key={f} style={{ color: C.ink, marginTop: 4 }}>
              {FIELD_LABELS[f] || f}: <span style={{ color: C.muted, textDecoration: "line-through" }}>{showValue(f, v.before)}</span> → {showValue(f, v.after)}
            </div>
          ))}
          {c.reason ? <div style={{ color: C.muted, marginTop: 4 }}>Why: {c.reason}</div> : null}
        </div>
      ))}
    </div>
  );
}

const mono = (v) => (v ? <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 12 }}>{v}</span> : null);

function Inspector({ id, onClose, onOpen, onChanged }) {
  // Mounted with key={id}, so each item starts fresh. `version` reloads it after a save or undo.
  const [state, setState] = useState({ loading: true });
  const [showAll, setShowAll] = useState(false);
  const [editing, setEditing] = useState(false);
  const [version, setVersion] = useState(0);
  const [log, setLog] = useState({ version: -1, changes: null });

  useEffect(() => {
    let live = true;
    getOwnerMimsItem(id)
      .then((d) => live && setState({ data: d }))
      .catch((e) => live && setState({ error: e.message }));
    getOwnerMimsItemChanges(id)
      .then((d) => live && setLog({ version, changes: d.changes || [] }))
      .catch(() => live && setLog({ version, changes: [] }));
    return () => {
      live = false;
    };
  }, [id, version]);

  const reload = () => {
    setEditing(false);
    setVersion((v) => v + 1);
    if (onChanged) onChanged();
  };

  const d = state.data;
  const it = d?.item || {};
  const r = d?.restaurant;

  return (
    <PageCard style={{ padding: 18, position: "sticky", top: 12, maxHeight: "calc(100vh - 24px)", overflowY: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.ink }}>{it.item_name || (state.loading ? "Loading…" : "Menu item")}</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Item #{id}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {d && !editing ? (
            <button type="button" onClick={() => setEditing(true)} style={buttonStyle}>
              Edit
            </button>
          ) : null}
          <button type="button" onClick={onClose} style={buttonStyle} aria-label="Close item">Close</button>
        </div>
      </div>
      {d && editing ? <EditForm key={String(it.updated_at)} item={it} onSaved={reload} onCancel={() => setEditing(false)} /> : null}

      {state.error ? <div style={{ marginTop: 14, color: "#b42318", fontSize: 13 }}>{state.error}</div> : null}

      {d ? (
        <>
          {d.chain_dish_for_copy ? (
            <div style={{ marginTop: 14, padding: "10px 12px", borderRadius: 10, background: C.accentSoft, fontSize: 13, color: C.ink }}>
              This is one store&apos;s copy of a chain dish. The chain dish is the one to look at and edit.{" "}
              <button type="button" style={{ ...buttonStyle, height: 26, padding: "0 10px", fontSize: 12 }} onClick={() => onOpen(d.chain_dish_for_copy.id)}>
                Open chain dish #{d.chain_dish_for_copy.id}
              </button>
            </div>
          ) : null}

          {d.row_kind !== "chain_dish" && d.location_problem ? (
            <div style={{ marginTop: 14, padding: "10px 12px", borderRadius: 10, background: "#fef3f2", color: "#b42318", fontSize: 13 }}>
              Location problem: {PROBLEM_TEXT[d.location_problem] || d.location_problem}
            </div>
          ) : null}

          <Section title="Identity">
            <Fields
              rows={[
                ["Universal ID", mono(d.identity.universal_id)],
                ["Location ID", mono(d.identity.location_universal_id)],
                ["Location status", d.identity.location_status],
                ["Chain product ID", mono(d.identity.product_universal_id)],
                ["Common Knowledge row", `#${it.id}`],
                ["Item UID", mono(it.menu_item_uid)],
              ]}
            />
          </Section>

          <Section title="Dish">
            <Fields
              rows={[
                ["Name", it.item_name],
                ["Section", it.section_name],
                ["Description", it.description],
                ["Price", money(it.price)],
                ["Type", ROW_KIND_TEXT[d.row_kind] || "Dish"],
                ["Menu status", it.menu_status],
                ["Needs review", it.needs_review ? "Yes" : "No"],
                ["Review notes", it.review_notes],
                ["Source", it.source_label],
                ["Created", when(it.created_at)],
                ["Updated", when(it.updated_at)],
              ]}
            />
          </Section>

          {d.chain_view ? (
            <Section title={`Chain: ${r?.chain_name || "chain"} · all stores`}>
              <Fields
                rows={[
                  ["Chain price", money(d.chain_view.chain_price)],
                  ["Stores", d.chain_view.store_count.toLocaleString()],
                  ["Price differs at", `${d.chain_view.price_differs} store${d.chain_view.price_differs === 1 ? "" : "s"}`],
                  ["Not sold at", `${d.chain_view.not_sold} store${d.chain_view.not_sold === 1 ? "" : "s"}`],
                ]}
              />
              <div style={{ fontSize: 12, color: C.muted, margin: "8px 0" }}>
                Every store sells this dish as the chain does, except where listed below. Edits here apply to all stores.
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, margin: "10px 0 6px" }}>Stores with a different price</div>
              <MiniTable
                empty="None. Every store uses the chain price."
                rows={d.chain_view.price_differences}
                cols={[
                  ["Store", (x) => `${x.restaurant_name} #${x.restaurant_id}`],
                  ["Where", (x) => [x.city, x.state].filter(Boolean).join(", ")],
                  ["Price", (x) => money(x.price)],
                  ["From", (x) => x.via],
                ]}
              />
              <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, margin: "12px 0 6px" }}>Stores that don&apos;t sell it</div>
              <MiniTable
                empty="None. Every store sells it."
                rows={d.chain_view.not_sold_at}
                cols={[
                  ["Store", (x) => `${x.restaurant_name} #${x.restaurant_id}`],
                  ["Where", (x) => [x.city, x.state].filter(Boolean).join(", ")],
                  ["From", (x) => x.via],
                ]}
              />
              <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, margin: "12px 0 6px" }}>Store-only items at this chain</div>
              <MiniTable
                empty="None."
                rows={d.chain_view.store_only_items}
                cols={[
                  ["Item", (x) =>
                    x.menu_item_id ? (
                      <button type="button" style={{ ...buttonStyle, height: 24, padding: "0 8px", fontSize: 12 }} onClick={() => onOpen(x.menu_item_id)}>
                        {x.item_name}
                      </button>
                    ) : (
                      x.item_name
                    )],
                  ["Store", (x) => `${[x.city, x.state].filter(Boolean).join(", ")} #${x.restaurant_id}`],
                  ["Price", (x) => money(x.price)],
                ]}
              />
            </Section>
          ) : null}

          <Section title={d.row_kind === "chain_dish" ? "Where the chain menu is kept" : "Restaurant location"}>
            {r ? (
              <Fields
                rows={[
                  ["Restaurant", `${r.restaurant_name} (#${r.id})`],
                  ["Address", [r.address_line1, r.address_line2].filter(Boolean).join(", ")],
                  ["City", [r.city, r.state, r.postal_code].filter(Boolean).join(", ")],
                  ["Chain", r.chain_name],
                  ["Store code", r.store_code],
                  ["Clusters", (d.clusters || []).map((c) => c.name + (c.membership_status !== "active" ? " (inactive)" : "")).join(", ")],
                  ["Active", r.active ? "Yes" : "No"],
                  ["Claim", r.claim_status],
                ]}
              />
            ) : (
              <div style={{ fontSize: 13, color: "#b42318" }}>This dish isn't attached to a restaurant.</div>
            )}
            {d.menu ? (
              <div style={{ fontSize: 12, color: C.muted, marginTop: 8 }}>
                Menu: {d.menu.display_name || d.menu.name || `#${d.menu.id}`} · {d.menu.status || "—"} · {d.menu.source_type || "—"}
              </div>
            ) : null}
          </Section>

          {d.chain_product ? (
            <Section title="Chain product">
              <Fields
                rows={[
                  ["Product", `${d.chain_product.name} (#${d.chain_product.id})`],
                  ["Chain code", mono(d.chain_product.external_item_id)],
                  ["Base price", money(d.chain_product.base_price)],
                  ["This store's price", d.store_override ? money(d.store_override.price) : "No store price"],
                  ["Available here", d.store_override ? (d.store_override.is_available === false ? "No" : "Yes") : "—"],
                  ["Category", d.chain_product.category],
                ]}
              />
            </Section>
          ) : null}

          <Section title="Price history">
            <MiniTable
              empty="No price history recorded."
              rows={d.price_history}
              cols={[
                ["Scope", (x) => x.scope],
                ["Price", (x) => minorMoney(x.price_minor_units)],
                ["From", (x) => when(x.effective_start_date)],
                ["To", (x) => when(x.effective_end_date)],
                ["Source", (x) => x.source_type],
              ]}
            />
          </Section>

          <Section title="Nutrition">
            {d.nutrition ? (
              <Fields
                rows={[
                  ["Calories", d.nutrition.calories_kcal === null ? null : Math.round(Number(d.nutrition.calories_kcal))],
                  ["Protein / fat / carbs (g)", [d.nutrition.protein_g, d.nutrition.fat_g, d.nutrition.carbs_g].map((v) => (v === null ? "—" : Number(v))).join(" / ")],
                  ["Sodium (mg)", d.nutrition.sodium_mg],
                  ["Source", d.nutrition.source],
                  ["Confidence", d.nutrition.confidence_score],
                  ["Computed", when(d.nutrition.computed_at)],
                ]}
              />
            ) : (
              <div style={{ fontSize: 13, color: C.muted }}>No nutrition on file.</div>
            )}
          </Section>

          <Section title="Classification">
            {d.classification ? (
              <Fields
                rows={[
                  ["MKS key", mono(d.classification.mks_code)],
                  ["Confidence", d.classification.confidence === null ? null : `${Math.round(Number(d.classification.confidence) * 100)}%`],
                  ["Method", d.classification.mapping_method],
                  ["Status", d.classification.mapping_status],
                  ["Reviewed", when(d.classification.reviewed_at)],
                ]}
              />
            ) : (
              <div style={{ fontSize: 13, color: C.muted }}>Not classified.</div>
            )}
            <div style={{ marginTop: 10 }}>
              <MiniTable
                empty="No classification history."
                rows={d.classification_history}
                cols={[
                  ["When", (x) => when(x.created_at)],
                  ["Why", (x) => x.change_reason],
                  ["Review", (x) => x.review_status],
                  ["Manual", (x) => (x.manual_override_applied ? "Yes" : "")],
                ]}
              />
            </div>
          </Section>

          <Section title="Problems">
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>Same name at this location</div>
            <MiniTable
              empty="None."
              rows={d.possible_duplicates}
              cols={[
                ["Item", (x) => (
                  <button type="button" onClick={() => onOpen(x.id)} style={{ ...buttonStyle, height: 26, padding: "0 8px", fontSize: 12 }}>
                    #{x.id}
                  </button>
                )],
                ["Name", (x) => x.item_name],
                ["Section", (x) => x.section_name],
                ["Price", (x) => money(x.price)],
                ["Status", (x) => x.menu_status],
              ]}
            />
            <div style={{ fontSize: 12, color: C.muted, margin: "12px 0 6px" }}>Import exceptions</div>
            <MiniTable
              empty="None."
              rows={d.exceptions}
              cols={[
                ["Type", (x) => x.failure_type],
                ["Reason", (x) => x.ai_reason],
                ["Suggested", (x) => x.suggested_resolution],
                ["Status", (x) => x.status],
              ]}
            />
          </Section>

          <Section title="Edits in Menu Items">
            <EditLog itemId={id} changes={log.version === version ? log.changes : null} onUndone={reload} />
          </Section>

          <Section title="History">
            <MiniTable
              empty="No recorded changes."
              rows={d.audit_events}
              cols={[
                ["When", (x) => when(x.created_at)],
                ["Event", (x) => x.event_type],
                ["By", (x) => [x.actor_type, x.source].filter(Boolean).join(" · ")],
                ["Status", (x) => (x.previous_status || x.new_status ? `${x.previous_status || "—"} → ${x.new_status || "—"}` : "")],
              ]}
            />
          </Section>

          <Section title="All fields">
            <button type="button" onClick={() => setShowAll((v) => !v)} style={buttonStyle}>
              {showAll ? "Hide" : "Show"} every stored field
            </button>
            {showAll ? (
              <pre style={{ marginTop: 10, fontSize: 11, background: "#f7f7f5", padding: 10, borderRadius: 8, overflowX: "auto", whiteSpace: "pre-wrap" }}>
                {JSON.stringify(it, null, 2)}
              </pre>
            ) : null}
          </Section>
        </>
      ) : null}
    </PageCard>
  );
}

export default function OwnerMenuItems() {
  const [search, setSearch] = useSearchParams();
  const params = useMemo(() => {
    const o = {};
    for (const k of FILTER_KEYS) if (search.get(k)) o[k] = search.get(k);
    return o;
  }, [search]);
  const openId = search.get("item");

  const [facets, setFacets] = useState(null);
  const [result, setResult] = useState({ key: null, items: [] });

  useEffect(() => {
    getOwnerMimsFacets().then(setFacets).catch(() => setFacets({}));
  }, []);

  // Metro default (2026-11-19): no metro in the URL means Los Angeles; "all" means every metro.
  // The first search waits for the metro list so it doesn't run unfiltered and then again for LA.
  const query = useMemo(() => {
    if (!facets) return null;
    const q = { ...params };
    if (!q.metro_id && facets.default_metro_id) q.metro_id = String(facets.default_metro_id);
    if (q.metro_id === "all") delete q.metro_id;
    return q;
  }, [params, facets]);

  const [refresh, setRefresh] = useState(0);
  const key = JSON.stringify(query) + "#" + refresh;
  useEffect(() => {
    if (!query) return undefined;
    let live = true;
    searchOwnerMimsItems({ ...query, limit: 50 })
      .then((d) => live && setResult({ key, ...d }))
      .catch((e) => live && setResult({ key, items: [], error: e.message }));
    return () => {
      live = false;
    };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  // While a new search runs, the last results stay on screen.
  const state = { ...result, loading: result.key !== key, error: result.key === key ? result.error : null };

  const setParam = useCallback(
    (k, v) => {
      const next = new URLSearchParams(search);
      if (v === "" || v === null || v === undefined) next.delete(k);
      else next.set(k, v);
      if (k !== "page") next.delete("page");
      setSearch(next, { replace: true });
    },
    [search, setSearch]
  );

  const open = (id) => {
    const next = new URLSearchParams(search);
    if (id) next.set("item", id);
    else next.delete("item");
    setSearch(next, { replace: true });
  };

  const clear = () => setSearch(new URLSearchParams(), { replace: true });

  const page = Number(params.page || 1);
  const total = state.total || 0;
  const pages = Math.max(1, Math.ceil(total / (state.limit || 50)));

  return (
    <OwnerLayout title="Menu Items">
      <div style={{ display: "grid", gap: 16 }}>
        <div style={{ fontSize: 13, color: C.muted }}>
          Every location dish across Menubloc. Open a dish to see everything about it, edit it, or undo an edit.
        </div>

        <Filters params={params} setParam={setParam} facets={facets} onClear={clear} />

        <div style={{ display: "grid", gridTemplateColumns: openId ? "minmax(0, 1.6fr) minmax(320px, 1fr)" : "minmax(0, 1fr)", gap: 16, alignItems: "start" }} className="mims-layout">
          <PageCard style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", borderBottom: `1px solid ${C.line}`, gap: 12, flexWrap: "wrap" }}>
              <div style={{ fontSize: 13, color: C.ink }}>
                {state.loading ? "Searching…" : `${total.toLocaleString()}${state.total_capped ? "+" : ""} dishes`}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, color: C.muted }}>
                <button type="button" style={buttonStyle} disabled={page <= 1 || state.loading} onClick={() => setParam("page", String(page - 1))}>
                  Previous
                </button>
                Page {page} of {pages.toLocaleString()}{state.total_capped ? "+" : ""}
                <button type="button" style={buttonStyle} disabled={page >= pages || state.loading} onClick={() => setParam("page", String(page + 1))}>
                  Next
                </button>
              </div>
            </div>
            {state.error ? (
              <div style={{ padding: 16, color: "#b42318", fontSize: 13 }}>{state.error}</div>
            ) : !state.loading && !(state.items || []).length ? (
              <div style={{ padding: 16 }}>
                <EmptyState>No dishes match these filters.</EmptyState>
              </div>
            ) : (
              <Grid items={state.items || []} selectedId={openId} onOpen={open} />
            )}
          </PageCard>

          {openId ? <Inspector key={openId} id={openId} onClose={() => open(null)} onOpen={open} onChanged={() => setRefresh((n) => n + 1)} /> : null}
        </div>
      </div>
      <style>{`@media (max-width: 980px) { .mims-layout { grid-template-columns: minmax(0, 1fr) !important; } }`}</style>
    </OwnerLayout>
  );
}
