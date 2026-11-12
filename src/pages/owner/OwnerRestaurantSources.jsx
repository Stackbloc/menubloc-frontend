import React, { useCallback, useEffect, useState } from "react";
import { OWNER_COLORS } from "./OwnerLayout.jsx";
import { addRestaurantSource, getRestaurantSources, removeRestaurantSource } from "../../lib/ownerApi.js";

/**
 * Restaurant Manager → Details → Sources (plan 34, 2026-11-11). Platform owner only (the whole
 * /owner portal is). The links bots saved for this restaurant (menu pages, hours pages, website,
 * store locator…) so the next Menubot / Hours Bot / Agent run starts there instead of searching
 * from scratch. Add a link the bots missed, or Remove a wrong one (bots never re-add it).
 * Chain-wide links (franchise menus, store locators) show here too but are managed on the chain.
 */

const FOUND_BY_LABELS = {
  menubot: "Menubot",
  hours_bot: "Hours Bot",
  address_bot: "Address Bot",
  location_bot: "Location Bot",
  franchise_bot: "Franchise Bot",
  agent: "Agent",
  pricebot: "PriceBot",
  photo_bot: "Photo Bot",
  health_dept_bot: "HealthDeptBot",
  platform_owner: "You",
  operator: "Restaurant",
  backfill: "Earlier data",
};

const RESULT_LABELS = {
  ok: "Worked",
  moved: "Moved",
  no_data: "Nothing useful",
  blocked: "Blocked",
  not_found: "Page gone",
  error: "Couldn't open",
};

const ADDABLE_KINDS = ["menu_page", "menu_pdf", "hours_page", "website", "order_page", "locator_page", "social", "health_dept", "google_place"];

const input = {
  boxSizing: "border-box",
  border: `1px solid ${OWNER_COLORS.line}`,
  borderRadius: 10,
  padding: "8px 10px",
  fontFamily: "inherit",
  fontSize: 13,
  background: "#fff",
};

const smallButton = {
  border: `1px solid ${OWNER_COLORS.line}`,
  background: "#fff",
  borderRadius: 10,
  padding: "6px 12px",
  fontWeight: 700,
  fontSize: 13,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

function shortDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { timeZone: "America/Los_Angeles", month: "short", day: "numeric", year: "numeric" });
}

function statusText(s) {
  if (s.dead) return "Stopped working";
  const parts = [];
  if (s.last_result) parts.push(RESULT_LABELS[s.last_result] || s.last_result);
  if (s.yielded) parts.push(s.yielded);
  if (s.last_checked_at) parts.push(`checked ${shortDate(s.last_checked_at)}`);
  return parts.join(" · ");
}

export default function OwnerRestaurantSources({ restaurantId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [kind, setKind] = useState("hours_page");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState("");
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    if (!restaurantId) return;
    try {
      const out = await getRestaurantSources(restaurantId);
      setData(out);
      setError("");
    } catch (err) {
      setError(err?.message || "Could not load sources");
    }
  }, [restaurantId]);

  useEffect(() => {
    setData(null);
    setUrl("");
    load();
  }, [load]);

  async function add(e) {
    e.preventDefault();
    if (!url.trim()) return;
    setBusy("add");
    setError("");
    try {
      await addRestaurantSource(restaurantId, { kind, url: url.trim() });
      setUrl("");
      await load();
    } catch (err) {
      setError(err?.message || "Could not save that link");
    } finally {
      setBusy("");
    }
  }

  async function remove(id) {
    setBusy(`rm:${id}`);
    setError("");
    try {
      await removeRestaurantSource(restaurantId, id);
      await load();
    } catch (err) {
      setError(err?.message || "Could not remove that link");
    } finally {
      setBusy("");
    }
  }

  if (!restaurantId) return null;
  const sources = data?.sources || [];
  const kinds = (data?.kinds || []).filter((k) => ADDABLE_KINDS.includes(k.kind));

  return (
    <div
      data-testid="owner-restaurant-sources"
      style={{ marginTop: 14, border: `1px solid ${OWNER_COLORS.line}`, borderRadius: 12, padding: 14, background: "#fff" }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{ border: "none", background: "none", padding: 0, cursor: "pointer", display: "flex", gap: 8, alignItems: "baseline", width: "100%", textAlign: "left" }}
      >
        <span style={{ fontWeight: 700, fontSize: 14, color: OWNER_COLORS.ink }}>Sources</span>
        <span style={{ fontSize: 13, color: OWNER_COLORS.muted }}>
          {data == null ? "" : data.ready === false ? "Not set up yet" : `${sources.length} saved link${sources.length === 1 ? "" : "s"}`}
        </span>
        <span style={{ marginLeft: "auto", fontSize: 13, color: OWNER_COLORS.muted }}>{open ? "Hide" : "Show"}</span>
      </button>

      {open ? (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 13, color: OWNER_COLORS.muted, marginBottom: 10 }}>
            Where bots found this restaurant&apos;s menu, hours and other details. Menubot and Hours Bot start here next time. Only you see this.
          </div>

          {data?.ready === false ? (
            <div style={{ fontSize: 13, color: "#9a3412" }}>Sources turn on once migration 0420 is applied.</div>
          ) : (
            <>
              {sources.length === 0 && data ? <div style={{ fontSize: 13, color: OWNER_COLORS.muted }}>No links saved yet.</div> : null}
              <div style={{ display: "grid", gap: 8 }}>
                {sources.map((s) => (
                  <div
                    key={s.id}
                    style={{ display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap", borderTop: `1px solid ${OWNER_COLORS.line}`, paddingTop: 8, opacity: s.dead ? 0.6 : 1 }}
                  >
                    <div style={{ flex: "1 1 260px", minWidth: 0 }}>
                      <div style={{ fontSize: 13 }}>
                        <strong>{s.kind_label}</strong>
                        {s.is_chain ? <span style={{ color: OWNER_COLORS.muted }}> · whole chain</span> : null}
                      </div>
                      <a href={s.url} target="_blank" rel="noreferrer" style={{ fontSize: 13, wordBreak: "break-all" }}>{s.url}</a>
                      <div style={{ fontSize: 12, color: OWNER_COLORS.muted, marginTop: 2 }}>
                        {FOUND_BY_LABELS[s.found_by] || s.found_by}
                        {statusText(s) ? ` · ${statusText(s)}` : ""}
                      </div>
                    </div>
                    {!s.is_chain ? (
                      <button type="button" style={smallButton} disabled={Boolean(busy)} onClick={() => remove(s.id)}>
                        {busy === `rm:${s.id}` ? "Removing…" : "Remove"}
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>

              <form onSubmit={add} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginTop: 12 }}>
                <select aria-label="What the page shows" style={input} value={kind} onChange={(e) => setKind(e.target.value)}>
                  {kinds.map((k) => <option key={k.kind} value={k.kind}>{k.label}</option>)}
                </select>
                <input
                  aria-label="Web address"
                  style={{ ...input, flex: "1 1 240px", minWidth: 0 }}
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://"
                />
                <button type="submit" style={smallButton} disabled={!url.trim() || Boolean(busy)}>
                  {busy === "add" ? "Adding…" : "Add link"}
                </button>
              </form>
            </>
          )}
          {error ? <div style={{ marginTop: 8, color: "#b91c1c", fontSize: 13 }}>{error}</div> : null}
        </div>
      ) : null}
    </div>
  );
}
