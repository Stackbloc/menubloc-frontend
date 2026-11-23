import React, { useCallback, useEffect, useState } from "react";
import { PageCard } from "./OwnerLayout.jsx";
import { getOwnerCkAppeals, resolveOwnerCkAppeal } from "../../lib/ckAppealsApi.js";
import { formatApiErrorForDisplay } from "../../lib/apiErrorDisplay.js";

/**
 * Owner → Reports → "Asked for review" (plan 73 PM1b, 2026-11-23; BE mig 0474). A diner asked CK to look
 * again at text it blocked. "Block was right" = upheld. "Wrong block" = overturned: the text still stays
 * off (no one-off bypass); the fix goes into the next CK terms version on Andre's go.
 */
const btn = (bg, fg, border = "transparent") => ({
  borderRadius: 8, padding: "7px 12px", fontSize: 14, fontWeight: 600, cursor: "pointer",
  background: bg, color: fg, border: `1px solid ${border}`,
});
const SURFACE = { wall: "Wall brick", vibe: "My Vibe" };
const CODE = {
  wall_threat: "threat", wall_hateful: "hateful words", wall_garbled: "garbled", wall_no_contact: "contact info",
  wall_no_links: "link", wall_repeated: "repeated letters",
};

export default function OwnerCkAppeals({ status = "open" }) {
  const want = status === "open" ? "open" : "all";
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [notice, setNotice] = useState("");

  const load = useCallback(() => {
    setError("");
    getOwnerCkAppeals(want)
      .then(setData)
      .catch((err) => setError(formatApiErrorForDisplay(err)));
  }, [want]);
  useEffect(load, [load]);

  async function act(a, outcome) {
    setBusyId(a.id);
    setError("");
    setNotice("");
    try {
      const out = await resolveOwnerCkAppeal(a.id, outcome);
      if (out?.next) setNotice(out.next);
      load();
    } catch (err) {
      setError(formatApiErrorForDisplay(err));
    } finally {
      setBusyId(null);
    }
  }

  const appeals = (data?.appeals || []).filter((a) => (status === "open" ? a.status === "open" : a.status !== "open"));
  if (data && !appeals.length && !error && !notice) return null;
  return (
    <section data-testid="owner-ck-appeals" style={{ marginBottom: 16 }}>
      <h2 style={{ fontSize: 17, margin: "4px 0 10px" }}>Asked for review</h2>
      {error ? <p role="alert" style={{ color: "#b42318" }}>{error}</p> : null}
      {notice ? <p style={{ color: "#5c665f" }}>{notice}</p> : null}
      {appeals.map((a) => (
        <PageCard key={a.id} style={{ padding: 16, marginBottom: 10 }} data-testid="owner-ck-appeal">
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ whiteSpace: "pre-wrap" }}>“{a.content_text}”</span>
            {a.message ? <span>Diner says: “{a.message}”</span> : null}
            <span style={{ color: "#5c665f", fontSize: 14 }}>
              {SURFACE[a.surface] || a.surface} · blocked as {(a.codes || []).map((c) => CODE[c] || c).join(", ")} · diner #{a.appellant_user_id}
              {" · "}{new Date(a.created_at).toLocaleString()}
            </span>
            {a.status === "open" ? (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
                <button type="button" disabled={busyId === a.id} style={btn("#fff", "#111613", "#e1e6e1")} onClick={() => act(a, "upheld")}>Block was right</button>
                <button type="button" disabled={busyId === a.id} style={btn("#fff", "#b42318", "#b42318")} onClick={() => act(a, "overturned")}>Wrong block</button>
              </div>
            ) : (
              <span style={{ fontSize: 14 }}>
                {a.status === "upheld" ? "Block was right" : "Wrong block (fix in next terms version)"}
                {a.resolved_by ? ` · ${a.resolved_by}` : ""}
              </span>
            )}
          </div>
        </PageCard>
      ))}
    </section>
  );
}
