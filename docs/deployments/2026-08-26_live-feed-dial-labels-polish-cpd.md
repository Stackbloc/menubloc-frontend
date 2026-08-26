# CPD — Live Feed dial labels polish (2026-08-26)

## Summary

FE-only: smaller signal circles; title-case labels to the left of dials — All Content, I'm Eating, What I Wanna Eat, Eating Plans, Events.

## Deploy path

| Layer | Path | Branch | Commit | Gate |
|-------|------|--------|--------|------|
| FE | menubloc-frontend-main | main | `85d6820` | tip-gate PASS |
| BE | unchanged | main | `65a365fa` | health |

## Production tip

- Deployment: `menubloc-frontend-3oyy9f75b-menuply.vercel.app`
- Bundle: `index-BZDxB_ML.js`
- Tip-gate: PASS apex + www
- Prior tip: `cn4khcxk3` / `index-CSVYHrXa.js`

## Verify

1. Hard-refresh `/my-menuply` — dial labels left of small circles; want channel reads **What I Wanna Eat**

## Rollback

Prior tip `menubloc-frontend-cn4khcxk3-menuply.vercel.app` / `index-CSVYHrXa.js`
