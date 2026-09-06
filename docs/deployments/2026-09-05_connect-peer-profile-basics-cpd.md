# CPD — Connect peer blank + profile DOB/favorites + @home camera

**Date:** 2026-09-05  
**Scope:** FE tip ship (peer import + DOB/favorites UI + @home camera)  
**Result:** **CPD=INCOMPLETE** for DOB/favorites Save (amended 2026-09-05)

## Door

```
bash scripts/cpd-fe.sh "Connect peer blank + DOB favorites + @home camera inline"
```

## Tip

| Field | Value |
|-------|--------|
| Path | `menubloc-frontend-main` @ `main` |
| Feature commit | `ac288803` (tip-lock docs `e84f911b`) |
| Deploy | `menubloc-frontend-o9993977g-menuply.vercel.app` |
| Bundle | `index-BbKVopx_.js` |
| Tip-gate apex / www | `RESULT=PASS` (tip identity only) |

## What shipped (tip)

1. Restored `formatDinerPeerLabel` import — Connect peer pages no longer blank (`/account/connections/:id`)
2. About Me: date of birth + favorite foods (Save) on `/feed/profile` — **Save path NOT E2E-proven**
3. `@home` camera on the same line as the section title

## Incomplete (do not treat as done)

- Authenticated `PUT /api/consumer/profile` with `date_of_birth` / `favorite_foods` never proven
- User reported live **Server error** on Save
- Prior note incorrectly claimed **CPD COMPLETE** via FE-only waiver — **invalid** under 2026-09-05 E2E/server-runtime amendment

## Required before Complete

1. Reproduce authenticated profile Save → fix 5xx/root cause  
2. E2E: trigger → accept → DB persist → GET read-back  
3. Smoke if BE touched; paste evidence in chat  
4. Re-CPD FE only after UX single-Save/collapse if that ships too  

## Human verify (peer / camera only until Save fixed)

- https://menuply.com/account/connections/124 loads peer hub  
- `@home` camera inline with title  
- **DOB/favorites Save: expect failure until reopened as Complete**
