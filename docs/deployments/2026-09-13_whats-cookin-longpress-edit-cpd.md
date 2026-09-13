# CPD — What’s cookin’ long-press Edit

**Date:** 2026-09-13  
**Status:** **CPD COMPLETE**

## Pre-CPD gate

| Check | Result |
|-------|--------|
| E2E | **PASS** — `railway run … node scripts/e2eWhatWeDoingPlanEditProbe.js` → `E2E_WHAT_WE_DOING_PLAN_EDIT=PASS` (create → `updateSessionDetails` place_label → read-back → cancel). FE contracts 11/11. |
| Server | **PASS** — same probe exercises production `updateSessionDetails` (the Save path behind long-press Edit). No BE code ship this tip. |

```text
E2E_WHAT_WE_DOING_PLAN_EDIT=PASS {
  key: 'e4b6b97d-5ee',
  planDate: '2026-10-28',
  place_label: 'Homemade. E2E plan edit CPD'
}
```

## Frontend

| Field | Value |
|-------|-------|
| Path | `menubloc-frontend-main` @ clean `main` |
| Feature commit | `10735a00` |
| Tip | `menubloc-frontend-8zdymdvrg-menuply.vercel.app` |
| Bundle | `index-idJTJX95.js` |
| Tip-gate apex/www | **PASS** |
| Content probe | `Edit eating plan` — **PASS** |

## Backend

Unchanged this tip (`be_commit` noted by cpd-fe: `f2e8a54e`). Mutation path already live.

## Product

What’s cookin’ rows: long-press shows **Edit | Delete**. Edit opens the eating-plan sheet prefilled; **Save** patches via `updateWhatWeDoingSession` (no duplicate create). Plan date unchanged (API does not PATCH `plan_date`).
