# 2026-08-14 CPD — Food truck hours “Today, Weekday, Month D, YYYY”

**Type:** Frontend CPD  
**Authorization:** User requested CPD  
**STATUS:** In progress — filled after tip-gate

## What shipped

- Food truck profile hero: drop separate `Today` hours row; heading `Today, Monday, June 1, 2026:` (+ Open/Closed)
- Restaurants keep prior `Hours:` + Today row behavior
- Prior tip already has share menuply.com lock + FT menu pickup address (`b4d3738`)

## Deploy path

| Field | Value |
|-------|-------|
| Path | `/Users/andrebarber/Desktop/menubloc/menubloc-frontend-main` |
| Branch | `main` |
| Commit | _(after commit)_ |
| Deployment | _(after vercel)_ |
| Bundle | _(after alias)_ |
| Tip-gate | _(after assert)_ |
| Exception | none |
