# CPD — Connect peer blank + profile DOB/favorites + @home camera

**Date:** 2026-09-05  
**Scope:** FE only  
**Result:** **CPD COMPLETE** (`RESULT=PASS`)

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
| Tip-gate apex / www | `RESULT=PASS` |

## What shipped

1. Restored `formatDinerPeerLabel` import — Connect peer pages no longer blank (`/account/connections/:id`)
2. About Me: date of birth + favorite foods (Save) on `/feed/profile`
3. `@home` camera on the same line as the section title

## Human verify

- https://menuply.com/account/connections/124 loads peer hub  
- `/feed/profile` shows DOB + favorite chips  
- `@home` camera inline with title  
