# CPD — Feed Eating tab real compose actions (2026-08-26)

## Summary

`/feed/eating` is no longer a My Menuply link farm. Create actions open in-shell compose/plan; Open destinations are distinct (diary, I'm Eating At, hub).

## Deploy path

| Layer | Path | Branch | Commit | Gate |
|-------|------|--------|--------|------|
| FE | menubloc-frontend-main | main | `2b4e9b9` | tip-gate PASS |
| BE | unchanged | main | `6d8df4b9` | health unchanged |

## Production tip

- Deployment: `menubloc-frontend-by4qfdlly-menuply.vercel.app`
- Bundle: `index-DhpQrWbK.js`
- Tip-gate: **PASS** apex + www
- Prior tip (rollback): `cyokwi8r6` / `index--02s1w-D.js`

## Verify

1. https://menuply.com/feed/eating — Create: I'm Eating / Wanna Eat / Eating Plan
2. I'm Eating opens compose sheet (not `/my-menuply?compose=ate`)
3. Open: diary → `/account/what-i-ate`; I'm Eating At → `/account/im-eating`; hub → `/my-menuply` once

## Rollback

```bash
npx vercel alias set menubloc-frontend-cyokwi8r6-menuply.vercel.app menuply.com
# + www/crm/venues; lock tip-gate to index--02s1w-D.js
```
