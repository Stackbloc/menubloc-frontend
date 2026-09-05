# CPD — Video Feed SEO (watch pages + JSON-LD + destination venue parity)

**Date:** 2026-09-05  
**Note:** video watch SEO + JSON-LD + destination venue parity

## Commits / tip

| Layer | Value |
|-------|--------|
| FE feature | `7f87c41d` — feat(seo): video watch pages, JSON-LD builders, venue middleware parity |
| FE tip-lock docs | `93c34a54` — docs: lock production tip after video feed SEO CPD |
| FE tip | `menubloc-frontend-ev98fpzs4-menuply.vercel.app` / `index-IkNxMB4h.js` |
| BE feature | `cac97103` — feat(seo): video watch meta resolve, venue sitemap, shared public meta |
| BE LKG sync | `16fe5ef5` — docs: sync LKG tip after video feed SEO FE CPD |
| BE health | `cac9710305d371ed57e5ab882f25aa79f39fe51f` |

## Doors

### BE — `cpd-be.sh` (paste)

```
=== CPD BE COMPLETE ===
RESULT=PASS
be_commit=cac97103
health_commit=cac9710305d371ed57e5ab882f25aa79f39fe51f
```

Smoke: 13/13 PASS including `public_sitemap_inventory`, `public_meta_video_invalid`, `public_meta_destination_venue_missing`.

### FE — `cpd-fe.sh`

```
=== CPD FE COMPLETE ===
RESULT=PASS
deploy=menubloc-frontend-ev98fpzs4-menuply.vercel.app
bundle=index-IkNxMB4h.js
fe_commit=7f87c41d
be_commit=cac97103
```

Tip-gate apex + www: **RESULT=PASS**.

## Live verification

| Check | Result |
|-------|--------|
| Inventory | `destination_venues`=31, `videos`=9 |
| `GET /public/meta/destination-venues/sofi-stadium` | ok, `venue_type=stadium` |
| `GET /public/meta/videos/managed/8` | ok, `indexable=true`, path `/videos/managed/8` |
| `https://menuply.com/videos/managed/8` | 200; HTML includes `application/ld+json`, `VideoObject`, `Restaurant` |
| `https://menuply.com/destination-venues/sofi-stadium` | 200; HTML includes `StadiumOrArena` JSON-LD |
| Sitemap | 9 `/videos/…` + 31 `/destination-venues/…` URLs |
| robots.txt | `Allow: /` — no path block for new routes |

## Scope shipped

- Shared JSON-LD builders (restaurant, menu item, venue-type map, VideoObject)
- Canonical `/videos/{kind}/{id}` watch page + middleware meta/JSON-LD
- Untagged → `noindex` + excluded from sitemap
- Destination venue base-page SEO parity (meta + sitemap + JSON-LD)
- No Waiter / Home / ClusterPage client JSON-LD refactor

## Follow-ups (optional)

- Feed share deep-link → canonical watch URL
- Human browse of a few watch pages in Search Console over time
