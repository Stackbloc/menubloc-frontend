# CPD — Diner QR invitee connect copy (2026-08-16)

## Summary

Shipped invitee-facing connect landing copy: social-app framing + “Continue to review {Name}'s invitation,” owner page lead as share-to-invite, self-scan no longer says “This is your personal Diner QR.” Permanent QR model unchanged (signup → connect).

## Deploy path

| Layer | Path | Branch | Commit | Tree |
|-------|------|--------|--------|------|
| FE | `/Users/andrebarber/Desktop/menubloc/menubloc-frontend-main` | `main` | `7d5c7df` | clean after commit |
| BE | `/Users/andrebarber/Desktop/menubloc/menubloc-backend-main` | `main` | `31b4c12e` | clean; path-gate PASS (docs-only audit mark) |

## FE tip

- Deployment: `menubloc-frontend-iyxv62rs6-menuply.vercel.app`
- Bundle: `index-6JpzKw-R.js`
- Aliases: `menuply.com`, `www.menuply.com`, `crm.menuply.com`, `venues.menuply.com`
- Tip-gate: PASS (apex + www) after lock update
- Bundle probe: `social app for discovering and sharing`, `Continue to review`; no `This is your personal Diner QR`

## BE health

- `commit_hash` starts with `31b4c12e` (docs push after What We Doing `4a03818e`)

## Prior tip (restore if needed)

`menubloc-frontend-8pl3zm05l-menuply.vercel.app` / `index-DxsHvAHk.js`
