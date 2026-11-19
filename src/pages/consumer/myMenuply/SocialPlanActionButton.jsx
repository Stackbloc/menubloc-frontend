/**
 * The button on a Connect's plan (Andre approved 2026-10-28, menuply-mobile docs/15 Phase B):
 *   Join / Ask to Join → asks (an open plan lets you in straight away)
 *   Requested ✓ → click again to take the ask back · Going ✓ → opens the plan
 * `plain` (2026-11-19, unified search; same as app PlanActionButton `plain`): a text action,
 * no pill — for rows in Search → Social.
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { askToJoinSocialPlan, cancelSocialPlanAsk } from "../../../lib/consumerApi.js";
import * as s from "./myMenuplyStyles.js";

const LABEL = { join: "Join", ask: "Ask to Join", asked: "Requested ✓", going: "Going ✓" };

export default function SocialPlanActionButton({ plan, testId, plain = false }) {
  const [action, setAction] = useState(plan.action);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const inApp = plan.source && plan.ref;
  const quiet = action === "asked" || action === "going";
  const style = plain ? (quiet ? styles.plainQuiet : styles.plain) : quiet ? styles.quiet : styles.button;

  if (action === "going" || !inApp) {
    return plan.href ? (
      <Link to={plan.href} style={style} data-testid={testId}>
        {LABEL[action] || "Open"}
      </Link>
    ) : (
      <span style={style} data-testid={testId}>
        {LABEL[action] || ""}
      </span>
    );
  }

  async function press() {
    setBusy(true);
    setFailed(false);
    try {
      if (action === "asked") {
        await cancelSocialPlanAsk(plan.source, plan.ref);
        setAction("ask");
      } else {
        const r = await askToJoinSocialPlan(plan.source, plan.ref);
        setAction(r?.action === "going" ? "going" : "asked");
      }
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" onClick={press} disabled={busy} style={{ ...style, border: "none", cursor: "pointer" }} data-testid={testId}>
      {busy ? "…" : failed ? "Try again" : LABEL[action]}
    </button>
  );
}

const base = {
  padding: "6px 14px",
  borderRadius: 999,
  fontWeight: 700,
  fontSize: 13,
  textDecoration: "none",
  flexShrink: 0,
};
const styles = {
  button: { ...base, background: s.GREEN_BRIGHT, color: "#fff" },
  quiet: { ...base, background: "#dcfce7", color: s.GREEN },
  // 2026-11-19: plain text action for Search → Social rows.
  plain: { padding: 4, fontWeight: 700, fontSize: 13, textDecoration: "none", flexShrink: 0, background: "transparent", color: "var(--gb-color-accent)" },
  plainQuiet: { padding: 4, fontWeight: 700, fontSize: 13, textDecoration: "none", flexShrink: 0, background: "transparent", color: "#9CA3AF" },
};
