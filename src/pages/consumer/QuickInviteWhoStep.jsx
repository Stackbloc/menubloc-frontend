/**
 * Quick Invite step 1 (Andre 2026-10-29, same as the app): who it's for. Typing checks your
 * Connects; a Connect can get it in Menuply or by text, anyone else (maybe not on Menuply) by text.
 * `value` = { name, userId (null when not a Connect), via: "app" | "text" } or null.
 */
import React, { useEffect, useMemo, useState } from "react";
import { listConnections } from "../../lib/consumerApi.js";
import { connectPeersFromResponse, matchConnectPeers } from "../../lib/quickInviteWho.js";

export default function QuickInviteWhoStep({ value, onChange, signedIn }) {
  const [peers, setPeers] = useState(null);
  const [typed, setTyped] = useState("");

  useEffect(() => {
    if (!signedIn) return undefined;
    let alive = true;
    listConnections("accepted")
      .then((body) => alive && setPeers(connectPeersFromResponse(body)))
      .catch(() => alive && setPeers([]));
    return () => {
      alive = false;
    };
  }, [signedIn]);

  const matches = useMemo(() => matchConnectPeers(peers || [], typed), [peers, typed]);
  const trimmed = typed.trim();
  const exact = matches.some((p) => p.name.toLowerCase() === trimmed.toLowerCase());
  const isConnect = value?.userId != null;

  return (
    <section style={styles.wrap} data-testid="quick-invite-who-step">
      <div style={styles.step}>Who&apos;s it for?</div>
      {value ? (
        <div style={styles.chosen} data-testid="quick-invite-who-chosen">
          <div style={{ display: "grid", gap: 2, flex: 1 }}>
            <strong style={{ fontSize: 15, color: "#0f172a" }}>{value.name}</strong>
            <span style={styles.muted}>{isConnect ? "Your Connect" : "Not a Connect"}</span>
          </div>
          <button type="button" style={styles.link} onClick={() => onChange(null)} data-testid="quick-invite-who-change">
            Change
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 6 }}>
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="Friend's name"
            maxLength={40}
            autoComplete="off"
            style={styles.input}
            data-testid="quick-invite-who"
          />
          {signedIn && peers == null && trimmed ? <span style={styles.muted}>Checking your Connects…</span> : null}
          {matches.map((p) => (
            <button
              key={p.id}
              type="button"
              style={styles.row}
              onClick={() => onChange({ name: p.name, userId: p.id, via: "app" })}
              data-testid={`quick-invite-connect-${p.id}`}
            >
              <strong>{p.name}</strong>
              <span style={styles.muted}>Your Connect</span>
            </button>
          ))}
          {trimmed.length >= 2 && !exact ? (
            <button
              type="button"
              style={{ ...styles.row, borderStyle: "dashed" }}
              onClick={() => onChange({ name: trimmed, userId: null, via: "text" })}
              data-testid="quick-invite-who-typed"
            >
              <strong>Use “{trimmed}”</strong>
              <span style={styles.muted}>Not a Connect: send by text</span>
            </button>
          ) : null}
        </div>
      )}

      {value ? (
        <>
          <div style={styles.step}>How do you want to send it?</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {isConnect ? (
              <Choice label="In Menuply" on={value.via === "app"} onClick={() => onChange({ ...value, via: "app" })} testId="quick-invite-via-app" />
            ) : null}
            <Choice label="By text" on={value.via === "text"} onClick={() => onChange({ ...value, via: "text" })} testId="quick-invite-via-text" />
          </div>
          <span style={styles.muted}>
            {value.via === "app"
              ? `${value.name} gets it in Menuply.`
              : `You text ${value.name} a link. They can open it and RSVP without a Menuply account.`}
          </span>
        </>
      ) : null}
    </section>
  );
}

function Choice({ label, on, onClick, testId }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      data-testid={testId}
      style={{
        ...styles.chip,
        ...(on ? { background: "#16a34a", borderColor: "#16a34a", color: "#fff" } : null),
      }}
    >
      {label}
    </button>
  );
}

const styles = {
  wrap: { display: "grid", gap: 10, marginBottom: 16 },
  step: { fontSize: 13, fontWeight: 800, color: "#15803d" },
  muted: { fontSize: 12, color: "#64748b" },
  input: { width: "100%", boxSizing: "border-box", borderRadius: 10, border: "1px solid #d6d3d1", padding: "12px 12px", fontSize: 15 },
  row: { display: "grid", gap: 2, textAlign: "left", padding: "10px 12px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", fontSize: 14, color: "#0f172a", cursor: "pointer" },
  chosen: { display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff" },
  link: { border: "none", background: "none", color: "#15803d", fontWeight: 800, fontSize: 14, cursor: "pointer" },
  chip: { borderRadius: 999, border: "1px solid #d6d3d1", background: "#fff", padding: "8px 16px", fontSize: 14, fontWeight: 700, color: "#0f172a", cursor: "pointer" },
};
