# CPD — Remove camera idle Record video verbiage

**Date:** 2026-08-25  
**Trigger:** Andre `cpd` (scoped: camera only — no My Menuply WIP)

## What shipped

- Removed idle-panel text: “Record video (up to 10 minutes)” / “Opens your phone camera to record”
- Video mode = blank preview; **Record video** button kept

## Not shipped

- Uncommitted Invite Me Out / My Menuply WIP (stashed)
- Local `wip/see-whos-eating` (`8052002`) — not pushed / not on tip

## Deploy path

| Layer | Path | Branch | Commit | Tree before deploy |
|-------|------|--------|--------|--------------------|
| FE | `menubloc-frontend-main` | `main` | `d8969f7` | clean |
| BE | — | — | — | FE-only |

## Frontend

| Field | Value |
|-------|-------|
| Vercel | `menubloc-frontend-3mxbigczz-menuply.vercel.app` |
| Bundle | `index-DgFyE8U0.js` |
| Tip-gate | **PASS** apex + www |
| Smoke | no `Record video (up to` / phone-camera idle hint in bundle |

## Backend

| Field | Value |
|-------|-------|
| Railway health | `b0781d7a…` |
| Change | none |
