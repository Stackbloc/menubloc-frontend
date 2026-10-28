/** Lunch · Dinner · Event … as a small colored pill (Andre 2026-10-28). */
import { PLAN_TAG_COLORS, planTag } from "../../../lib/socialPlanTags.js";

export default function PlanTag({ plan, testId }) {
  const t = planTag(plan);
  const c = PLAN_TAG_COLORS[t.tone];
  return (
    <span
      data-testid={testId}
      style={{
        display: "inline-block",
        background: c.bg,
        color: c.fg,
        fontSize: 11,
        fontWeight: 800,
        borderRadius: 999,
        padding: "1px 8px",
        marginRight: 6,
      }}
    >
      {t.label}
    </span>
  );
}
