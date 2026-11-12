/**
 * Plans in my calendar (plan 37, Andre 2026-11-12): confirmed, scheduled plans in Google Calendar
 * and Apple Calendar.
 *   CalendarSyncCard — subscribe once (Google / Apple); prompt on My Social Calendar until connected
 *     or "Not now", and under ⚙︎ with Copy link + Reset link.
 *   AddPlanToCalendar — one plan, right away (a copy: it won't move if the plan changes).
 * Nothing shows while calendar_sync is off (the server answers 404 feature_off).
 * Actions are green words, no boxes (Andre 2026-11-06: no green pills, no full-width buttons).
 */

import { useState } from "react";
import { getPlanCalendarLinks, resetCalendarFeed } from "../../../lib/consumerApi.js";

const DISMISS_KEY = "menuply.calendarSync.dismissed";

function wasDismissed() {
  try {
    return window.localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

export function CalendarSyncCard({ feed, onFeed, variant = "settings", testId = "calendar-sync" }) {
  const [hidden, setHidden] = useState(() => variant === "prompt" && wasDismissed());
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  if (!feed || hidden || (variant === "prompt" && feed.connected)) return null;

  const dismiss = () => {
    setHidden(true);
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* private window: hides for this visit */
    }
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(feed.feed_url);
      setCopied(true);
    } catch {
      window.prompt("Copy your calendar link", feed.feed_url);
    }
  };
  const reset = async () => {
    if (!window.confirm("Reset calendar link? Calendars using the old link stop updating, and you'll add Menuply to your calendar again.")) return;
    setError("");
    try {
      onFeed(await resetCalendarFeed());
      setCopied(false);
    } catch {
      setError("Couldn’t reset the link. Try again.");
    }
  };

  return (
    <section style={variant === "prompt" ? styles.card : styles.plain} data-testid={testId}>
      <strong style={styles.heading}>Add to my calendar</strong>
      <span style={styles.muted}>
        {feed.connected
          ? "Your confirmed plans are in your calendar. Changes show up there on their own."
          : "Your confirmed plans show up in your calendar and stay up to date."}
      </span>
      <div style={styles.actions}>
        <a href={feed.google_subscribe_url} target="_blank" rel="noopener noreferrer" style={styles.action} data-testid={`${testId}-google`}>
          Google Calendar
        </a>
        <a href={feed.webcal_url} style={styles.action} data-testid={`${testId}-apple`}>
          Apple Calendar
        </a>
      </div>
      {variant === "settings" ? (
        <>
          <div style={styles.actions}>
            <button type="button" onClick={copy} style={styles.small} data-testid={`${testId}-copy`}>
              {copied ? "Link copied" : "Copy link"}
            </button>
            <button type="button" onClick={reset} style={styles.smallMuted} data-testid={`${testId}-reset`}>
              Reset link
            </button>
          </div>
          <span style={styles.muted}>Google can take a few hours to show new plans. Use Add to calendar on a plan to add it now.</span>
        </>
      ) : (
        <button type="button" onClick={dismiss} style={styles.smallMuted} data-testid={`${testId}-dismiss`}>
          Not now
        </button>
      )}
      {error ? <span style={styles.error}>{error}</span> : null}
    </section>
  );
}

/** "Add to calendar": asks for this plan's links on first click, then shows Google / Apple. */
export function AddPlanToCalendar({ plan, testId }) {
  const [links, setLinks] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const id = testId || `plan-calendar-${plan.key}`;

  const load = async () => {
    setBusy(true);
    setError("");
    try {
      setLinks(await getPlanCalendarLinks(plan.source, plan.id));
    } catch {
      setError("Couldn’t get calendar links.");
    } finally {
      setBusy(false);
    }
  };

  if (!links) {
    return (
      <span style={styles.planRow} data-testid={id}>
        <button type="button" onClick={load} disabled={busy} style={styles.small} data-testid={`${id}-open`}>
          {busy ? "…" : "Add to calendar"}
        </button>
        {error ? <span style={styles.error}>{error}</span> : null}
      </span>
    );
  }
  if (!links.can_add) {
    return (
      <span style={styles.muted} data-testid={`${id}-cant`}>
        {links.reason || "This plan can’t go in your calendar yet."}
      </span>
    );
  }
  return (
    <span style={styles.planRow} data-testid={id}>
      <span style={styles.label}>Add to calendar</span>
      <a href={links.google_event_url} target="_blank" rel="noopener noreferrer" style={styles.small} data-testid={`${id}-google`}>
        Google
      </a>
      <a href={links.ics_url} style={styles.small} data-testid={`${id}-apple`}>
        Apple
      </a>
    </span>
  );
}

const green = "#15803d";
const styles = {
  card: { display: "grid", gap: 8, padding: 14, borderRadius: 12, border: "1px solid #e2e8f0", background: "#fff", margin: "12px 0" },
  plain: { display: "grid", gap: 8, paddingTop: 12, marginTop: 12, borderTop: "1px solid #e2e8f0" },
  heading: { fontSize: 15, color: "#0f172a" },
  muted: { fontSize: 13, color: "#64748b" },
  actions: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: 20 },
  action: { color: green, fontWeight: 600, fontSize: 15, textDecoration: "none" },
  small: { background: "none", border: "none", padding: 0, color: green, fontWeight: 700, fontSize: 13, cursor: "pointer", textDecoration: "none" },
  smallMuted: { background: "none", border: "none", padding: 0, color: "#64748b", fontWeight: 600, fontSize: 13, cursor: "pointer", justifySelf: "start" },
  error: { fontSize: 13, color: "#b91c1c" },
  planRow: { display: "inline-flex", flexWrap: "wrap", alignItems: "center", gap: 14, padding: "4px 2px" },
  label: { fontSize: 13, color: "#64748b" },
};
