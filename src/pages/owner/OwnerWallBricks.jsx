import React, { useCallback, useEffect, useState } from "react";
import { actOnOwnerWallBrick, createOwnerOfficialBrick, getOwnerWallBricks } from "../../lib/ownerContentReportsApi.js";
import { formatApiErrorForDisplay } from "../../lib/apiErrorDisplay.js";
import { WALL_MATERIALS, WALL_THEMES, wallAgo } from "../../lib/clusterWallStyles.js";

/**
 * Owner → Reports → Wall bricks (2026-11-06 redesign, mig 0397). Bricks are permanent, so admins can:
 * - pin a brick to the top (stays there regardless of age) and unpin it (it goes back to its place),
 * - remove any brick (its slot becomes a plain brick; the row doesn't move),
 * - write a "— Menuply" brick, pinned by default (e.g. "Menuply is coming to USC – January 2027!").
 */
export default function OwnerWallBricks({ slug = "usc" }) {
  const [q, setQ] = useState("");
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState("");
  const [body, setBody] = useState("");
  const [theme, setTheme] = useState("stucco");

  const load = useCallback(
    async (query = "") => {
      setErr("");
      try {
        setData(await getOwnerWallBricks(slug, query));
      } catch (e) {
        setErr(formatApiErrorForDisplay(e));
      }
    },
    [slug]
  );

  useEffect(() => {
    const t = setTimeout(() => load(""), 0);
    return () => clearTimeout(t);
  }, [load]);

  async function act(publicId, action) {
    if (action === "remove" && !window.confirm("Remove this brick from the Wall? Its spot becomes a plain brick.")) return;
    setBusy(publicId);
    try {
      await actOnOwnerWallBrick(publicId, action);
      await load(q);
    } catch (e) {
      setErr(formatApiErrorForDisplay(e));
    } finally {
      setBusy("");
    }
  }

  async function postOfficial(e) {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy("official");
    try {
      await createOwnerOfficialBrick(slug, { body: body.trim(), style: { font: "marker", theme, underline: "red" }, pin: true });
      setBody("");
      await load(q);
    } catch (e2) {
      setErr(formatApiErrorForDisplay(e2));
    } finally {
      setBusy("");
    }
  }

  return (
    <section style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: 12, margin: "12px 0", display: "grid", gap: 10 }} data-testid="owner-wall-bricks">
      <h3 style={{ margin: 0, font: "800 16px/1.2 system-ui" }}>{slug.toUpperCase()} Wall bricks</h3>
      <p style={{ margin: 0, color: "#4b5563", font: "500 13px/1.4 system-ui" }}>
        Pin a brick to keep it on top. Remove takes it off the Wall for good (its spot becomes a plain brick).
      </p>

      <form onSubmit={postOfficial} style={{ display: "grid", gap: 6 }}>
        <label style={{ font: "700 12px/1 system-ui", color: "#4b5563" }}>Pinned Menuply brick</label>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={160}
            placeholder="Menuply is coming to USC – January 2027!"
            style={{ flex: "1 1 260px", padding: 8, border: "1px solid #d1d5db", borderRadius: 4 }}
          />
          <select value={theme} onChange={(e) => setTheme(e.target.value)} style={{ padding: 8 }}>
            {WALL_MATERIALS.map((k) => (
              <option key={k} value={k}>{WALL_THEMES[k].label}</option>
            ))}
          </select>
          <button type="submit" disabled={!body.trim() || busy === "official"} style={{ padding: "8px 12px" }}>
            Post + pin
          </button>
        </div>
      </form>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          load(q);
        }}
        style={{ display: "flex", gap: 6 }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search words or paste a brick link"
          style={{ flex: 1, padding: 8, border: "1px solid #d1d5db", borderRadius: 4 }}
        />
        <button type="submit" style={{ padding: "8px 12px" }}>Search</button>
      </form>
      {err ? <p style={{ color: "#b91c1c", margin: 0 }}>{err}</p> : null}

      <div style={{ display: "grid", gap: 6 }}>
        {(data?.bricks || []).map((b) => (
          <div key={b.public_id} style={{ display: "flex", gap: 8, alignItems: "center", borderTop: "1px solid #f3f4f6", paddingTop: 6 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ font: "600 14px/1.3 system-ui", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {b.pinned ? "📌 " : ""}
                {b.kind !== "text" ? `[${b.kind}] ` : ""}
                {b.body || "(no words)"}
              </div>
              <div style={{ font: "500 12px/1.3 system-ui", color: "#6b7280" }}>
                — {b.official ? "Menuply" : b.author?.first_name || "Guest"} · {wallAgo(b.published_at)}
                {b.report_count ? ` · ${b.report_count} report${b.report_count === 1 ? "" : "s"}` : ""} ·{" "}
                <a href={b.path} target="_blank" rel="noreferrer">open</a>
              </div>
            </div>
            <button type="button" disabled={busy === b.public_id} onClick={() => act(b.public_id, b.pinned ? "unpin" : "pin")}>
              {b.pinned ? "Unpin" : "Pin"}
            </button>
            <button type="button" disabled={busy === b.public_id} onClick={() => act(b.public_id, "remove")} style={{ color: "#b91c1c" }}>
              Remove
            </button>
          </div>
        ))}
        {data && !data.bricks?.length ? <p style={{ margin: 0, color: "#6b7280" }}>No bricks found.</p> : null}
      </div>
    </section>
  );
}
