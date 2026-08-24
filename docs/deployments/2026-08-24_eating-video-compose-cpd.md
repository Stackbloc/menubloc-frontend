# CPD — Eating video durable upload + compose menu item — 2026-08-24

**Status:** **COMPLETE** (deploy + tip-gate; **E2E video smoke pending Andre**)

## Summary

What I'm Eating video showed a black placeholder because the only production clip used an ephemeral Railway `/uploads/` URL (404 after redeploy). Compose also lost the selected menu item when capturing photo/video because React remounted on filename change.

Ship: portrait capture in existing Menuply frames (not tall reel UI), blank-clip validation, 60s cap, compose key fix, dish→restaurant fill, BE guard requiring Supabase `https://` URLs in production.

## Deploy path

| Layer | Path | Branch | Commit | Gate |
|-------|------|--------|--------|------|
| FE feature | `menubloc-frontend-main` | `main` | `ec2dbca` | tip live |
| BE feature | `menubloc-backend-main` | `main` | `d15c9260` | health match |
| FE tip lock + LKG docs | `menubloc-frontend-main` | `main` | (this commit) | tip-gate PASS |

## Production tip

- Deployment: `menubloc-frontend-5hahxk6st-menuply.vercel.app`
- Bundle: `index-CYtSPDxP.js`
- Aliases: menuply.com, www, crm, venues
- Tip-gate: **PASS** apex + www (2026-08-24)
- Lock: `scripts/assert-menuply-production-tip.sh` → `5hahxk6st` / `index-CYtSPDxP.js`
- Bundle smoke: railway=59 localhost=9
- BE `/health` `commit_hash`: `d15c9260`

## Verify (Andre)

1. My Menuply → What I'm Eating → pick restaurant + menu item → capture photo or video → **menu item stays selected**
2. Record new video ≤60s → Post → DB `video_url` must be `https://*.supabase.co/...` (not `/uploads/`)
3. Video plays on feed (tap for sound)
4. **Old Aug 23 Chai Latte clip cannot be recovered** — re-record

## Rollback

Prior tip `626p0j6hy` / `index-D_Nc-5PD.js` (Failed-to-fetch size/MIME CPD)
