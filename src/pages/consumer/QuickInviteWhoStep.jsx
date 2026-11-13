/**
 * Quick Invite step 1 (app quick-invite.tsx, OTA b2d23b2, Andre 2026-11-13): a plain checklist.
 * Every Connect with a round check and, when they have one, a fav cue ("Favs pancakes"); no vibes
 * (Today shows those). "Open Invite · All my Connects" checks them all. Next (n) › sits in a bar
 * pinned to the bottom, off until someone is checked.
 *
 * Next asks once, in a small box (app: "Invite phone contacts?", Andre 2026-11-13; it was a footer
 * link): the web can't read phone contacts, so it asks "Invite someone who isn't a Connect?" — Add a
 * name opens the name field (that person gets the link through the share sheet), Not now goes on.
 * With nobody checked Next still opens the box once; after Not now it's off until someone is picked.
 *
 * Props: peers (null while loading), checked (Set of user ids), onToggle(id), onToggleAll(),
 * picked ([{ id, name }] typed names), onPicked(list), signedIn, count, onNext().
 */
import React, { useState } from "react";
import { connectCue } from "../../lib/quickInviteWho.js";

const C = {
  accent: "#0f7a24",
  text: "#111613",
  muted: "#5c665f",
  border: "#e1e6e1",
  surface: "#f5f7f4",
  white: "#ffffff",
};

export default function QuickInviteWhoStep({ peers, checked, onToggle, onToggleAll, picked, onPicked, signedIn, count, onNext }) {
  const [other, setOther] = useState(false);
  const [box, setBox] = useState(false);
  const [asked, setAsked] = useState(false);
  const nextOff = !count && asked;

  function next() {
    if (!asked && !other) {
      setBox(true);
      return;
    }
    if (count) onNext();
  }
  function notNow() {
    setAsked(true);
    setBox(false);
    if (count) onNext();
  }
  function addName() {
    setAsked(true);
    setBox(false);
    setOther(true);
  }
  const [typedName, setTypedName] = useState("");
  const list = peers || [];
  const allOn = list.length > 0 && list.every((p) => checked.has(p.id));

  function addTyped() {
    const name = typedName.trim().slice(0, 40);
    if (name.length < 2) return;
    const id = `typed-${name.toLowerCase()}`;
    if (!picked.some((x) => x.id === id)) onPicked([...picked, { id, name }]);
    setTypedName("");
  }

  return (
    <section style={styles.wrap} data-testid="quick-invite-who-step">
      <div style={styles.step}>Quick Invite</div>
      {signedIn && peers == null ? <span style={styles.muted}>Loading your Connects…</span> : null}
      {!signedIn ? <span style={styles.muted}>Sign in to invite your Connects. Anyone else gets a link from you.</span> : null}
      {list.length ? (
        <div style={styles.list} data-testid="quick-invite-who">
          {/* Open Invite = every Connect checked (Andre 2026-11-13). */}
          {list.length > 1 ? (
            <CheckRow label="Open Invite" sub="All my Connects" on={allOn} onClick={onToggleAll} testId="quick-invite-all" />
          ) : null}
          {list.map((p) => (
            <CheckRow
              key={p.id}
              label={p.name}
              sub={connectCue(p)}
              avatar={<Avatar url={p.avatarUrl} name={p.name} />}
              on={checked.has(p.id)}
              onClick={() => onToggle(p.id)}
              testId={`quick-invite-connect-${p.id}`}
            />
          ))}
        </div>
      ) : signedIn && peers != null ? (
        <span style={styles.muted}>No Connects yet. Tap Next to invite someone by name and send them the link.</span>
      ) : null}

      {picked.length ? (
        <div style={styles.list} data-testid="quick-invite-picked">
          {picked.map((c) => (
            <CheckRow key={c.id} label={c.name} sub="You send the link" on onClick={() => onPicked(picked.filter((x) => x.id !== c.id))} testId={`quick-invite-picked-${c.id}`} />
          ))}
        </div>
      ) : null}

      {other ? (
        <>
          <div style={styles.step}>Not a Connect?</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addTyped();
              }}
              placeholder="Their name"
              maxLength={40}
              autoComplete="off"
              autoFocus
              style={styles.input}
              data-testid="quick-invite-typed-name"
            />
            <button type="button" style={styles.link} onClick={addTyped} data-testid="quick-invite-who-typed">
              Add
            </button>
          </div>
          <span style={styles.muted}>They get the link from you, by text or any app. No Menuply account needed.</span>
        </>
      ) : null}

      {/* Pinned above the tab bar (app: above the phone's nav bar) so Next is always in reach.
          Compact text links, no full-width button (Andre 2026-10-29). */}
      <div style={styles.footer} data-testid="quick-invite-footer">
        <span style={{ flex: 1 }} />
        <button
          type="button"
          disabled={nextOff}
          onClick={next}
          style={{ ...styles.link, opacity: nextOff ? 0.4 : 1, cursor: nextOff ? "default" : "pointer" }}
          data-testid="quick-invite-next"
        >
          {count ? `Next (${count}) ›` : "Next ›"}
        </button>
      </div>

      {/* A small box after Next, asked once (app "Invite phone contacts?", Andre 2026-11-13). Text links, no pills. */}
      {box ? (
        <div style={styles.scrim} onClick={notNow} data-testid="quick-invite-contacts-scrim">
          <div role="dialog" aria-modal="true" aria-labelledby="qi-box-title" style={styles.box} onClick={(e) => e.stopPropagation()} data-testid="quick-invite-contacts-box">
            <strong id="qi-box-title" style={{ fontSize: 16, color: C.text }}>
              Invite someone who isn’t a Connect?
            </strong>
            <span style={styles.muted}>They get the link from you, by text or any app. No Menuply account needed.</span>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 24, paddingTop: 4 }}>
              <button type="button" style={{ ...styles.link, color: C.muted }} onClick={notNow} data-testid="quick-invite-contacts-no">
                Not now
              </button>
              <button type="button" style={styles.link} onClick={addName} data-testid="quick-invite-contacts-yes">
                Add a name
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Avatar({ url, name }) {
  const initial = String(name || "?").trim().charAt(0).toUpperCase() || "?";
  return url ? (
    <img src={url} alt="" width={36} height={36} style={styles.avatar} />
  ) : (
    <span style={{ ...styles.avatar, display: "inline-flex", alignItems: "center", justifyContent: "center", background: C.surface, color: C.muted, fontWeight: 700 }} aria-hidden>
      {initial}
    </span>
  );
}

/** A row with a round check on the right (multi-select). Checked = dark, not green (Andre 2026-11-06). */
function CheckRow({ label, sub, avatar = null, on, onClick, testId }) {
  return (
    <button type="button" role="checkbox" aria-checked={on} aria-label={sub ? `${label}, ${sub}` : label} onClick={onClick} style={styles.row} data-testid={testId}>
      {avatar}
      <span style={{ display: "grid", gap: 2, flex: 1, minWidth: 0, textAlign: "left" }}>
        <strong style={styles.name}>{label}</strong>
        {sub ? <span style={styles.muted}>{sub}</span> : null}
      </span>
      <span style={{ ...styles.check, ...(on ? styles.checkOn : null) }} aria-hidden>
        {on ? "✓" : ""}
      </span>
    </button>
  );
}

const styles = {
  wrap: { display: "grid", gap: 10, marginBottom: 16 },
  step: { fontSize: 13, fontWeight: 700, color: C.accent },
  muted: { fontSize: 13, color: C.muted },
  name: { fontSize: 15, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  list: { borderRadius: 12, border: `1px solid ${C.border}`, background: C.white, overflow: "hidden" },
  row: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    width: "100%",
    minHeight: 56,
    padding: "8px 16px",
    border: "none",
    borderBottom: `1px solid ${C.border}`,
    background: "none",
    cursor: "pointer",
    fontFamily: "inherit",
    boxSizing: "border-box",
  },
  avatar: { width: 36, height: 36, borderRadius: 18, objectFit: "cover", flex: "0 0 auto" },
  check: {
    width: 24,
    height: 24,
    flex: "0 0 auto",
    borderRadius: 12,
    border: `2px solid ${C.border}`,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    fontWeight: 700,
    color: C.white,
    boxSizing: "border-box",
  },
  checkOn: { background: C.text, borderColor: C.text },
  input: { flex: 1, minWidth: 0, boxSizing: "border-box", borderRadius: 10, border: `1px solid ${C.border}`, padding: "10px 12px", fontSize: 15 },
  link: { border: "none", background: "none", padding: "8px 0", color: C.accent, fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "inherit" },
  scrim: { position: "fixed", inset: 0, zIndex: 40, background: "rgba(17,22,19,0.35)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 },
  box: { width: "100%", maxWidth: 320, boxSizing: "border-box", background: C.white, borderRadius: 12, padding: 16, display: "grid", gap: 8 },
  footer: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: "var(--bottom-nav-h, 72px)",
    zIndex: 20,
    display: "flex",
    alignItems: "center",
    gap: 16,
    padding: "6px max(16px, calc((100vw - 720px) / 2 + 16px))",
    borderTop: `1px solid ${C.border}`,
    background: C.surface,
    boxSizing: "border-box",
  },
};
