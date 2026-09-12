# CPD — Per-instance Join Me (plans + events)

**Date:** 2026-09-12  
**Status:** **CPD COMPLETE**

## Pre-CPD gate

| Check | Result |
|-------|--------|
| E2E | **PASS** — lab: no section `preset-plans` / `preset-events`; event compose shows **Open to Join Me** (`feedHomeToProfileNav` / contracts) |
| Server | **PASS** — `cpd-be.sh` + migration `20260912_0320` applied; smoke includes social-events probes |
| Live tip hop | Content probe **Open to Join Me** in live tip JS — **PASS** (nav/Edit·Connect class n/a for this ship) |

## Frontend

| Field | Value |
|-------|-------|
| Path | `menubloc-frontend-main` @ clean `main` |
| Feature commit | `1461990a` |
| Tip | `menubloc-frontend-nb8mg6esm-menuply.vercel.app` |
| Bundle | `index-DPelKA96.js` |
| Tip-gate apex/www | **PASS** |
| Content probe | `Open to Join Me` (first probe used comment-only `per event instance` → INCOMPLETE; lock-only with UI string → PASS) |
| `cpd-fe.sh` | **RESULT=PASS** (deploy+alias then `--lock-only`) |

## Backend

| Field | Value |
|-------|-------|
| Path | `menubloc-backend-main` @ clean `main` |
| Feature commit | `8a67878f` (per-event Join Me audience + peer visibility) |
| Tip-lock docs HEAD / `health_commit` | `413fa84008594179fec71d4c1d7a53e89472774d` |
| Migration | `20260912_0320_diner_social_event_join_audience.sql` — **applied** |
| Smoke | `RESULT=PASS passed=20` (includes `consumer_social_events_list` + `consumer_peer_social_events`) |
| `cpd-be.sh --no-push` | **RESULT=PASS** (paste below) |

```text
RESULT=PASS
be_commit=413fa840
health_commit=413fa84008594179fec71d4c1d7a53e89472774d
RESULT=PASS passed=20
```

## Product

- Join Me eligibility is **per plan/event instance**, not section category “On.”
- Removed plans/events `DinerSocialPresetsPanel` scopes; new instances default Join Me off.
- Events: `JoinMeAudiencePicker` on compose; cards show Join Me open / Just me; peer hub loads eligible events via `GET /api/consumer/connections/:peerId/social-events`.
- Wanna Eat **Invite Me** and Crews **Join Crew** presets unchanged.

## Audit

`docs/audits/2026-09-12_per-instance-join-me-plans-events.md`
