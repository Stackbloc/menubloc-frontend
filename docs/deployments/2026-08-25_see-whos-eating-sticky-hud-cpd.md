# CPD — See Who’s Eating sticky HUD + drop My Menuply lead

**Date:** 2026-08-25  
**Trigger:** Andre `cpd` (after sticky/high-tech + remove lead blurb)

## What shipped

### Frontend (`b6d894d` + prior `969a077` / `07eeb25` / `5a260cf` on tip)

- See Who’s Eating: sticky under page header, high-tech HUD frame (LIVE FEED)
- Removed My Menuply hero lead (“Your social food profile…”)
- Invite Me Out on/off + eligibility dialog (already on `main`)

### Backend (`bacd8051` — already on Railway)

- Market discoverable eating-video feed + CK dish tags
- Migrations `0287` / `0288`

## Deploy path

| Layer | Path | Branch | Commit | Tree before deploy |
|-------|------|--------|--------|--------------------|
| FE | `menubloc-frontend-main` | `main` | `b6d894d` | clean |
| BE | `menubloc-backend-main` | `main` | `bacd8051` | clean (path-gate PASS; no new push this CPD) |

## Frontend

| Field | Value |
|-------|-------|
| Vercel | `menubloc-frontend-80fy979wl-menuply.vercel.app` |
| Bundle | `index-BfPQn7JE.js` |
| Aliases | menuply.com, www, crm, venues |
| Tip-gate | **PASS** apex + www |
| Smoke | railway=59 localhost=9 |

## Backend

| Field | Value |
|-------|-------|
| Railway health | `bacd8051…` |
| Change this CPD | none (already live) |

## Human verify

1. `/my-menuply` — sticky See Who’s Eating HUD under header; scroll keeps reel pinned
2. No “Your social food profile…” under the My Menuply title
3. Invite Me Out on/off under What I Want to Eat (signed in)
