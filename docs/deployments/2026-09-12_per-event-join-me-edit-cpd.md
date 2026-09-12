# CPD — Per-event Turn on Join Me (edit path)

**Date:** 2026-09-12  
**Status:** **CPD COMPLETE**

## Pre-CPD gate

| Check | Result |
|-------|--------|
| E2E | **PASS** — lab mobile: **Turn on Join Me** on card → Edit sheet → **Open to Join Me** / **Save event** |
| Server | **PASS** — `cpd-be.sh` RESULT=PASS; smoke includes `consumer_social_events_patch` |

## Backend

| Field | Value |
|-------|-------|
| Path | `menubloc-backend-main` @ clean `main` |
| Commit / `health_commit` | `4df68ce2ff7f10da952b29e634ae20f2beaa0ca6` |
| Smoke | `RESULT=PASS passed=21` |
| Change | `PATCH /api/consumer/social-events/:eventId` (`updateEntry`) |

```text
RESULT=PASS
be_commit=4df68ce2
health_commit=4df68ce2ff7f10da952b29e634ae20f2beaa0ca6
RESULT=PASS passed=21
```

## Frontend

| Field | Value |
|-------|-------|
| Path | `menubloc-frontend-main` @ clean `main` |
| Feature commit | `99e3e74b` |
| Tip | `menubloc-frontend-bh3wmye63-menuply.vercel.app` |
| Bundle | `index-BKe1Q783.js` |
| Tip-gate apex/www | **PASS** |
| Content probe | `Turn on Join Me` — **PASS** |
| `cpd-fe.sh` | **RESULT=PASS** |

## Product

My events cards (Edit View): **Turn on Join Me** / **Edit Join Me** per event — same class as What’s cookin’ per-plan Join Me. No section-wide events preset.
