# CPD — Cluster landing consumer dashboard (2026-08-17)

## Summary

Shipped a scan-first cluster page: name + short blurb, local day/date/time, Today's Hotspots (up to 10), Popular today, Who's eating here (de-duplicated comments), On campus, nearby published events (30 miles). Dining-hall menus are not analyzed. Waiter feed builder unchanged (events are landing-only).

## Deploy path

| Layer | Path | Branch | Commit | Tree |
|-------|------|--------|--------|------|
| FE | `/Users/andrebarber/Desktop/menubloc/menubloc-frontend-main` | `main` | `11e792e` | clean after feature commit |
| BE | `/Users/andrebarber/Desktop/menubloc/menubloc-backend-main` | `main` | `a8980221` | clean; path-gate PASS |

## FE tip

- Deployment: `menubloc-frontend-30qbi67vq-menuply.vercel.app`
- Bundle: `index-CMXfgjwr.js`
- Aliases: `menuply.com`, `www.menuply.com`, `crm.menuply.com`, `venues.menuply.com`
- Tip-gate: PASS (apex + www) after lock update
- Bundle probe: `Today's Hotspots`, `cluster-dashboard-clock`, `On campus`; Railway `60` vs `localhost:3001` `9`

## BE health

- Shipped SHA: `a89802214c080b0ade35d3a99fb16c43edfcd982`
- Railway `/health` `commit_hash`: **MATCH**
- GitHub auto-deploy SUCCESS (`3ab07e64-79b5-4040-966d-d946ce33fa01`)
- `GET /public/clusters/usc/events` returns `ok: true` (events may be empty)

## Database

None.

## Prior tip (restore if needed)

`menubloc-frontend-9ijik4t7p-menuply.vercel.app` / `index-HPBXNwnC.js`
