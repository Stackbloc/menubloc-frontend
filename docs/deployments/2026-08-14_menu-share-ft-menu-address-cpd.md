# 2026-08-14 CPD — Menu share menuply.com lock + food truck menu current pickup address

**Type:** Frontend CPD  
**Authorization:** User requested CPD  
**STATUS:** In progress — filled after tip-gate

## What shipped

- Consumer share URLs forced to `https://menuply.com/...`; reject `share.google`; Copy Link primary; `npm run test:share-contract`
- Food truck public/catalog menus prefer `current_pickup_location` address lines (no “Current Location:” label)

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
