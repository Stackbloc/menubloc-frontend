# CPD — Profile hub Who's Eating / camera / MMT picker

**Date:** 2026-09-05  
**Scope:** FE only  
**Result:** **CPD COMPLETE** (`RESULT=PASS`)

## Door

```
bash scripts/cpd-fe.sh "profile hub Who's Eating camera MMT picker"
```

## Tip

| Field | Value |
|-------|--------|
| Path | `menubloc-frontend-main` @ `main` |
| Feature commit | `14fa526e` |
| Deploy | `menubloc-frontend-23s4kb6z7-menuply.vercel.app` |
| Bundle | `index-CWTXjHQj.js` |
| Tip-gate apex / www | `RESULT=PASS` |

## What shipped

1. What I'm Eating — camera icon on the same line as the section title (opens ate compose)
2. Who's Eating — max 5 registered-diner text links (`Name is eating food`); no video list / Open Feed
3. Removed From your connects + Meal Intel Intent blocks from Eating hub
4. Peer Wanna Eat graphic-first; owner videos OK (videos also in Feed)
5. Make Me This — one section link → multi-check dialog; badges only on opted-in items; owner Accept? on offers

## Contracts

15/15 pass: nearby/Who's Eating, social/meal-intel hub unmount, eating hub, makeMeThis, deals vs meal intel, phase7b8.

## Human verify

`/feed/profile` — camera inline; Who's Eating links; no Connects/Meal Intel sections; one Make Me This link; peer profile graphic-first.
