# Objective

Update the existing restaurant subscription comparison chart to Published / Starter / Founder's* with approved feature rows, prices, and Window QR Code footnote — frontend display only.

# Current Status

**LOCAL COMPLETE** — awaiting approval to commit / push / deploy.

# Files Changed

- `menubloc-frontend/src/components/PlanComparisonTable.jsx` — only application code change

Docs:

- `docs/audits/2026-07-14_restaurant-subscription-comparison-chart.md`
- `docs/handoffs/2026-07-14_restaurant-subscription-comparison-chart_handoff.md`

Verification artifacts:

- `menubloc-frontend/verification-output/plan-comparison-chart/desktop.png`
- `menubloc-frontend/verification-output/plan-comparison-chart/mobile.png`

# Database Changes

None.

# Decisions Made

- Chart data remains component-local (not Stripe / backend / entitlement registry)
- Single Founder's* column for monthly + annual (same feature set); Window QR note only via footnote for Annual
- Professional profile Published cell renders as `(Limited)` to match prior parenthetical pattern
- Commission cells use `Standard` / `Lowest` text (no percentages)
- Mobile: horizontal scroll (`overflow-x: auto`, `minWidth: 560`) — no new mobile redesign

# Remaining Work

1. User approval
2. Commit only `PlanComparisonTable.jsx` (+ docs if desired)
3. Deploy frontend + `vercel alias set … menuply.com`
4. Optional follow-up: expose Starter in plan-selection cards if product wants CTA parity

# Risks / Known Issues

- Plan cards above chart do not yet show a Starter CTA (intentional scope boundary)
- Workspace has many unrelated dirty files on `stabilize/frontend-safe-baseline` — commit must stage this file carefully

# Verification Status

| Check | Result |
|-------|--------|
| Columns Published / Starter / Founder's* | PASS |
| Prices Free / $20|/|$199 / $39|/|$319 | PASS |
| Founder's asterisk + footnote | PASS |
| No Food Truck / no % commissions | PASS |
| eslint file | PASS |
| npm run build | PASS |
| Desktop + mobile screenshots | PASS |

# Resume Instructions

1. Review screenshots under `menubloc-frontend/verification-output/plan-comparison-chart/`
2. On approval: `cd menubloc-frontend && git add src/components/PlanComparisonTable.jsx` (and docs if desired)
3. Commit with recommended message below
4. Deploy Vercel production for `menubloc-frontend` then alias `menuply.com`
5. Verify `/restaurant/signup` and `/operator/subscription` on production

Recommended commit message:

```
fix(pricing): update restaurant subscription comparison chart

Align the signup/operator plan matrix to Published, Starter, and Founder's*
with approved feature rows, prices, and Window QR Code footnote.
```

# Git Status

- Worktree: `menubloc-frontend`
- Branch: `stabilize/frontend-safe-baseline`
- Change: uncommitted `src/components/PlanComparisonTable.jsx`
- Stopped before commit/push/deploy per request
