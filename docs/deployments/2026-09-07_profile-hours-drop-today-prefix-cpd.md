# CPD — Profile hours: drop “Today” prefix

**Date:** 2026-09-07  
**Door:** `cpd-fe.sh` (FE-only)

## FE

```
RESULT=PASS
deploy=menubloc-frontend-lteks2bns-menuply.vercel.app
bundle=index-DoXJBfY3.js
fe_commit=d287f249
tip-gate apex/www=PASS
```

## Product

- Opening-hours hero heading is weekday + date only (e.g. `Monday, September 7: not posted`).
- Removed leading `Today,` from `formatFoodTruckHoursTodayHeading` (restaurants + food trucks).

## BE

Unchanged this ship. Tip-lock LKG mirror may sync BE docs only.
