# CPD — Yellow Browser empty + hub calendar/parity (2026-08-20)

## Summary

FE ship restores Yellow Browser browse when location is unresolved, fixes blank dish detail (undeclared save-rail props), day-scopes Plans calendar text, and restores What I Ate empty-holder parity on peer hubs.

## Deploy path

| Layer | Path | Branch | Commit | Gate |
|-------|------|--------|--------|------|
| FE | menubloc-frontend-main | main | `a37baf0` | tip-gate PASS |
| BE | unchanged | — | live health `74a34f67` | not pushed |

## Production tip

- Deployment: `menubloc-frontend-9acktyci6-menuply.vercel.app`
- Bundle: `index-lG7D8UuY.js`
- Tip-gate: PASS apex + www
- Bundle scan: railway 59 / localhost 9

## Verify

1. Yellow Browser city browse shows menus (not empty on every chip)
2. Open a My Menuply `cmi:` dish → detail renders (not blank)
3. Plans calendar: alternate day → “No plans set” or restaurant + meal time
4. Joe Johnson peer What I Ate → same meal-row empty holders (“Nothing here”)

## Rollback

Prior tip `menubloc-frontend-6nzh7hvv5-menuply.vercel.app` / `index-RmW9q_Gr.js` (`cbc7728`)
