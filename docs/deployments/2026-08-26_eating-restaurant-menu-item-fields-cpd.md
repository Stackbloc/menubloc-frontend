# CPD — Eating restaurant + menu item fields (2026-08-26)

## Summary

I'm Eating and Wanna Eat (including Feed compose) show labeled **Restaurant** and **Menu item** fields; menu item search is available after restaurant pick.

## Deploy path

| Layer | Path | Branch | Commit | Gate |
|-------|------|--------|--------|------|
| FE | menubloc-frontend-main | main | `ee793c6` (feature) / tip build `4b147d5` | tip-gate PASS |
| BE | unchanged | main | `c2718fa7` | health unchanged |

## Production tip

- Deployment: `menubloc-frontend-cyokwi8r6-menuply.vercel.app`
- Bundle: `index--02s1w-D.js`
- Tip-gate: **PASS** apex + www
- Prior tip (rollback): `ipnr8htpu` / `index-C1TASeKC.js`

## Verify

1. https://menuply.com/feed → X → I'm Eating → after video, see **Restaurant** and **Menu item** labels
2. Pick restaurant → menu item search appears
3. Wanna Eat same restaurant + menu item fields
4. Homemade still skips restaurant/menu item

## Rollback

```bash
npx vercel alias set menubloc-frontend-ipnr8htpu-menuply.vercel.app menuply.com
# + www/crm/venues; lock tip-gate to index-C1TASeKC.js
```
