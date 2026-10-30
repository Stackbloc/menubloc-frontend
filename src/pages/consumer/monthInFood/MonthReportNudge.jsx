/**
 * "Your October in food is ready": the first week of a month, when last month has something in it
 * (Andre 2026-10-30). Closing it hides it until next month.
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMonthInFood } from "../../../lib/consumerApi.js";
import { nudgeMonth } from "../../../lib/monthInFoodNudge.js";
import { MY_MENUPLY_MONTH_IN_FOOD_PATH } from "../../../lib/myMenuplyRoutes.js";

const closedKey = (ym) => `menuply:month-nudge-closed:${ym}`;

export default function MonthReportNudge() {
  const month = nudgeMonth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!month) return undefined;
    try {
      if (localStorage.getItem(closedKey(month.ym))) return undefined;
    } catch {
      // Storage can be blocked; show it anyway.
    }
    let alive = true;
    getMonthInFood(month.ym)
      .then((r) => alive && setReady((r?.items_count || 0) + (r?.food_activity_count || 0) > 0))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [month?.ym]);

  if (!month || !ready) return null;
  const close = () => {
    setReady(false);
    try {
      localStorage.setItem(closedKey(month.ym), "1");
    } catch {
      // Storage can be blocked.
    }
  };
  return (
    <div style={styles.card} data-testid="month-report-nudge">
      <strong style={{ flex: 1, fontSize: 15 }}>{`Your ${month.name} in food is ready`}</strong>
      <Link to={`${MY_MENUPLY_MONTH_IN_FOOD_PATH}?ym=${month.ym}`} style={styles.pill} data-testid="month-report-nudge-open">
        See it
      </Link>
      <button type="button" aria-label="Close" onClick={close} style={styles.close}>
        ×
      </button>
    </div>
  );
}

const styles = {
  card: { display: "flex", alignItems: "center", gap: 8, background: "#16302A", color: "#fff", borderRadius: 12, padding: "12px 16px" },
  pill: { background: "#fff", color: "#16302A", borderRadius: 999, padding: "8px 14px", fontSize: 13, fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" },
  close: { width: 32, height: 32, border: "none", background: "transparent", color: "#fff", fontSize: 20, cursor: "pointer" },
};
