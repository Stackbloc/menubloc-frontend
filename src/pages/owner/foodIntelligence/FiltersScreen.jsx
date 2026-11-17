import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { OWNER_COLORS, PageCard, SectionTitle } from "../OwnerLayout.jsx";
import { CONTAINS_TAGS, fiApi } from "../../../lib/ownerFoodIntelligenceApi.js";
import { Banner, Btn, Loading, inputStyle, labelStyle, useLoad } from "./fiUi.jsx";

/**
 * Owner → Food Intelligence → Filters (plan 48 Phase 2). Read-only.
 * Shows the filter rows, which Food Ontology version Filters read, and "Check a dish":
 * today's answer next to the food-type answer, from the published version or a draft.
 * Food types' Contains are edited in Food Ontology (draft → check → publish).
 */

const BASE = "/owner/food-intelligence";
const TAG_LABEL = Object.fromEntries(CONTAINS_TAGS.map((t) => [t.tag, t.label]));
const RESULT = { pass: "Fits", fail: "Doesn't fit", unknown: "Not sure" };
const DECIDED = { owner: "the restaurant's own mark", words: "menu words", food_type: "food type", not_sure: "nothing could tell" };

const th = { textAlign: "left", padding: "8px 10px", fontSize: 12, fontWeight: 700, color: OWNER_COLORS.muted, borderBottom: `1px solid ${OWNER_COLORS.line}` };
const td = { padding: "8px 10px", fontSize: 13, borderBottom: `1px solid ${OWNER_COLORS.line}`, verticalAlign: "top" };

function errText(err) {
  return err ? err.message || String(err) : "";
}

function showsText(r) {
  return r.dish_shows ? "shows" : "hidden";
}

function Answer({ r }) {
  return (
    <div>
      <div style={{ fontWeight: 700 }}>{RESULT[r.result] || r.result}</div>
      <div style={{ fontSize: 12, color: OWNER_COLORS.muted }}>dish {showsText(r)}{r.decided_by ? ` · by ${DECIDED[r.decided_by] || r.decided_by}` : ""}</div>
    </div>
  );
}

function FilterRows({ data }) {
  const rows = data.filters || [];
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={th}>Filter</th>
            <th style={th}>Decided by</th>
            <th style={th}>Doesn't fit when the food contains</th>
            <th style={th}>When not sure</th>
            <th style={th}>In ☰ Filters</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((f) => (
            <tr key={f.key}>
              <td style={td}><strong>{f.label}</strong></td>
              <td style={td}>{f.kind === "exclude" ? "What it contains" : "Nutrition"}</td>
              <td style={td}>{f.excludes.length ? f.excludes.map((t) => TAG_LABEL[t] || t).join(", ") : "—"}</td>
              <td style={td}>{f.notSure === "show" ? "Show the dish" : "Hide the dish"}</td>
              <td style={td}>{f.shownInFilters ? "Yes" : "No (manual search only)"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ fontSize: 12, color: OWNER_COLORS.muted, marginTop: 8 }}>
        ☰ Filters stays at these five switches (Filters contract). Changing a filter row is a code change for now; the owner editor for rows comes later.
      </div>
    </div>
  );
}

function CheckDish({ drafts }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [key, setKey] = useState("");
  const [draftId, setDraftId] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [res, setRes] = useState(null);

  const run = async (e) => {
    e?.preventDefault?.();
    setBusy(true);
    setErr(null);
    try {
      const out = await fiApi.filtersCheck({
        name,
        description,
        food_type_key: key ? Number(key) : null,
        draft_id: draftId ? Number(draftId) : null,
      });
      setRes(out);
    } catch (error) {
      setErr(error);
      setRes(null);
    } finally {
      setBusy(false);
    }
  };

  const five = useMemo(() => (res?.filters || []).filter((f) => f.shown_in_filters), [res]);
  const others = useMemo(() => (res?.filters || []).filter((f) => !f.shown_in_filters), [res]);

  return (
    <form onSubmit={run}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
        <div>
          <label style={labelStyle}>Dish name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} style={{ ...inputStyle, width: "100%" }} placeholder="Glazed Donut" aria-label="Dish name" />
        </div>
        <div>
          <label style={labelStyle}>Description (optional)</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} style={{ ...inputStyle, width: "100%" }} aria-label="Dish description" />
        </div>
        <div>
          <label style={labelStyle}>Food type key</label>
          <input value={key} onChange={(e) => setKey(e.target.value.replace(/\D/g, ""))} inputMode="numeric" style={{ ...inputStyle, width: "100%" }} placeholder="1061000" aria-label="Food type key" />
        </div>
        <div>
          <label style={labelStyle}>Use Contains from</label>
          <select value={draftId} onChange={(e) => setDraftId(e.target.value)} style={{ ...inputStyle, width: "100%" }} aria-label="Contains source">
            <option value="">The published version</option>
            {drafts.map((d) => <option key={d.id} value={d.id}>Draft {d.number ?? d.id}{d.title ? ` · ${d.title}` : ""}</option>)}
          </select>
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <Btn kind="primary" type="submit" disabled={busy || !name.trim()}>Check</Btn>
      </div>
      {err ? <div style={{ marginTop: 12 }}><Banner tone="error">{errText(err)}</Banner></div> : null}
      {res ? (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 13, color: OWNER_COLORS.muted, marginBottom: 8 }}>
            Contains from {res.profiles_from.source === "published" ? "the published version" : `draft ${res.profiles_from.number ?? res.profiles_from.revision_id}`}
            {" "}({res.profiles_from.profile_count} food types with Contains).
            {res.switch_on ? " Filters use food types now." : " Filters don't use food types yet (switch off), so diners see the Today column."}
          </div>
          {res.food_type ? (
            <div style={{ fontSize: 13, marginBottom: 10 }}>
              <strong>Food type {res.food_type.key}:</strong>{" "}
              {Object.entries(res.food_type.tags).map(([t, l]) => `${TAG_LABEL[t] || t} ${l} (from ${res.food_type.from[t]?.label})`).join(" · ")}
            </div>
          ) : (
            <div style={{ fontSize: 13, marginBottom: 10, color: OWNER_COLORS.muted }}>{res.dish.food_type_key ? "That food type and its parents have no Contains yet." : "No food type given: only the menu words decide."}</div>
          )}
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>Filter</th>
                <th style={th}>Today (menu words)</th>
                <th style={th}>With food types</th>
              </tr>
            </thead>
            <tbody>
              {five.map((f) => (
                <tr key={f.key} style={f.changed ? { background: "#fffbeb" } : undefined}>
                  <td style={td}><strong>{f.label}</strong></td>
                  <td style={td}><Answer r={f.today} /></td>
                  <td style={td}><Answer r={f.by_food_type} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {others.length ? (
            <details style={{ marginTop: 10 }}>
              <summary style={{ cursor: "pointer", fontSize: 13, fontWeight: 700 }}>Manual-search filters</summary>
              <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 6 }}>
                <tbody>
                  {others.map((f) => (
                    <tr key={f.key}>
                      <td style={td}>{f.label}</td>
                      <td style={td}><Answer r={f.today} /></td>
                      <td style={td}><Answer r={f.by_food_type} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}

export default function FiltersScreen() {
  const reg = useLoad(() => fiApi.filtersRegistry(), []);
  const revs = useLoad(() => fiApi.revisions("food_ontology"), []);
  const drafts = (revs.data?.revisions || []).filter((r) => r.status === "draft");
  const d = reg.data;
  return (
    <>
      {reg.error ? <Banner tone="error">{errText(reg.error)}</Banner> : null}
      {reg.loading ? <Loading /> : d ? (
        <Banner tone={d.switch.on ? "ok" : "info"}>
          {d.switch.on
            ? <>Filters use food types now: the published Food Ontology version {d.published.number ?? "—"} ({d.published.profileCount} food types with Contains).</>
            : <>Filters don't use food types yet ({d.switch.name} is off). Publishing Contains in <Link to={`${BASE}/food_ontology`}>Food Ontology</Link> changes nothing for diners until it's turned on. Published now: version {d.published.number ?? "—"}, {d.published.profileCount} food types with Contains.</>}
        </Banner>
      ) : null}

      <PageCard style={{ padding: 20, marginBottom: 16 }}>
        <SectionTitle title="Check a dish" subtitle="What each filter does for one dish, today and with food types. Pick a draft to see your unpublished Contains." />
        <CheckDish drafts={drafts} />
      </PageCard>

      <PageCard style={{ padding: 20 }}>
        <SectionTitle title="Filters" subtitle="Each filter is one row. The menu's words can only hide a dish; the food type decides the rest." />
        {d ? <FilterRows data={d} /> : reg.loading ? <Loading /> : null}
      </PageCard>
    </>
  );
}
