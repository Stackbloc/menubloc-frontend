# Profile polish batch CPD — Windows In-N-Out splash crop, address format, Photos hide, Profile Manager UX

**Date:** 2026-08-14  
**Checkout:** `menubloc-frontend-main` @ `main`

## Product shipped (FE)

- In-N-Out billboard/Windows crop: splash asset + object-position; hero prefers `hero_image_url`
- Address display: street on line 1; City, ST ZIP on line 2 (peel comma-ZIP from street)
- Food truck: Current Location label; home address when no live post; Add to Contacts hover
- Hide additional Photos strip on public profiles (`showPhotos={false}`)
- Profile Manager: clarify Save profile vs Add update; unsaved banner + inline Save

## Data already live (no BE code deploy required)

- Klaudette `#78617`: address `900 Olympic Blvd`; about_us + founded 2020; LACC membership
- Embedded comma-ZIP peel applied earlier (In-N-Out street/zip split)

## Post-alias DB step

After splash JPEG is on tip:

```bash
railway run --service menubloc-backend --environment production -- \
  node scripts/ops/updateInNOutBillboardSplashCrop.js --apply --allow-production
```

## Deploy path

| Field | Value |
|-------|-------|
| Path | `/Users/andrebarber/Desktop/menubloc/menubloc-frontend-main` |
| Branch | `main` |
| Commit | _(filled after push)_ |
| Deployment | _(filled after vercel)_ |
| Bundle | _(filled after alias)_ |
| Tip-gate | _(filled after assert)_ |
| Exception | none |
