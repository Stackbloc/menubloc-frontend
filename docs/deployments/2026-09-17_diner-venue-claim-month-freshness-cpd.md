# Diner venue-claim gate + Month in Food freshness CPD

**Date:** 2026-09-17  
**Status:** **CPD COMPLETE**

## Summary

1. **My Events:** diners may create events at **user-designated** places only. Title/location that exact-match an active `destination_venues` name (e.g. State Farm Stadium) return `400` `venue_authored_event_required`. Venue events stay venue-authored; diners join those.
2. **Month in Food:** profile deletes notify stale + quiet refetch; API `Cache-Control: private, no-store`.

## Pre-CPD gate

| Check | Result |
|-------|--------|
| E2E | **PASS** — `railway run … node scripts/e2eDinerSocialEventVenueClaim.js` → `E2E_DINER_SOCIAL_EVENT_VENUE_CLAIM=PASS` (location + title blocked; Mom's backyard create+delete). Re-run after BE deploy also PASS. |
| Server | **PASS** — `cpd-be.sh` `RESULT=PASS` `health_commit=dad0eabc…` matching HEAD; smoke `passed=30` |

## Deploy

| Layer | Value |
|-------|-------|
| BE path | `menubloc-backend-main` @ `main` |
| BE commit / health | `dad0eabc` / `dad0eabc2607847ab4d4182b9902aa6f825eb3a8` |
| BE smoke | `RESULT=PASS passed=30` |
| FE path | `menubloc-frontend-main` @ `main` |
| FE commit | `8fa9a426` |
| FE tip | `menubloc-frontend-1pxbroz3a-menuply.vercel.app` |
| Live bundle | `index-cP6hz0nt.js` |
| Tip-gate apex/www | **PASS** |
| Content probe | `CPD_CONTENT_GREP=place you designate` **PASS** |
| Migration | n/a |

## CPD paste (health proof)

```
health_commit=dad0eabc2607847ab4d4182b9902aa6f825eb3a8
RESULT=PASS passed=30
```

```
E2E_DINER_SOCIAL_EVENT_VENUE_CLAIM=PASS
venueId: 1
venueLabel: 'State Farm Stadium'
```

```
=== CPD FE COMPLETE ===
RESULT=PASS
deploy=menubloc-frontend-1pxbroz3a-menuply.vercel.app
bundle=index-cP6hz0nt.js
fe_commit=8fa9a426
be_commit=dad0eabc
```

## Audit

`docs/audits/2026-09-17_diner-events-venue-authored-only.md`

## Human follow-up

X → My Events: personal place OK; “State Farm Stadium” as location should error. Delete a diary/plan/event then open Month in Food — counts should refresh without hard reload delay.
