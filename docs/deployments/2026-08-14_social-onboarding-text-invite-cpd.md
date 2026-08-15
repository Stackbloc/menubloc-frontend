# CPD — Social Onboarding text-invite step one

**Date:** 2026-08-14  
**STATUS: COMPLETE** — tip-gate PASS apex + www (+ crm)

## Shipped

Guided Social Onboarding with Dining Crew **step one = Text an invite** (Messages app + `menuply.com` invite link). No Menuply user-id fields. Phone / email / QR matching deferred (not step one).

| Commit | Message |
|--------|---------|
| `c3bfb55` | SOCIAL ONBOARDING — Guided Activation |
| `b8a3b51` | SOCIAL ONBOARDING — remove Menuply user-id friction; invite links only |
| `d8386dc` | SOCIAL ONBOARDING — step one texts Dining Crew invites via Messages |

**FE tip commit:** `d8386dc9e7e8dfebd2821d27c8df26eef4bc7319` on `menubloc-frontend-main` @ `main` (clean)

## Deploy

- Path: `/Users/andrebarber/Desktop/menubloc/menubloc-frontend-main`
- `npx vercel --prod --yes` → `menubloc-frontend-e9kop4og8-menuply.vercel.app`
- Alias: `menuply.com`, `www.menuply.com`, `crm.menuply.com`
- Bundle: `index-Di87A4Tc.js`
- Tip-gate: **PASS** (`menubloc-frontend-e9kop4og8-menuply.vercel.app` / `index-Di87A4Tc.js`)
- Bundle markers: `Text an invite`, `Text another invite`, `Messages app`; no `Menuply user id`
- API: railway=61 localhost=9
- Share: invite URLs normalized via existing `shareUtils` (`buildShareLinks` / `normalizeConsumerShareUrl`); ShareModal not edited

## Backend (already live; not redeployed this CPD)

- Path: `menubloc-backend-main` @ `main`
- Railway `/health` `commit_hash`: `924c14b5f06feb500ec3eaa29afa88a74df8337b`
- Migration `0247` `consumer_users.social_onboarding` applied
- `GET /api/consumer/social-onboarding` → 401 unauthenticated (route live)

## Tip lock

- Workspace `scripts/assert-menuply-production-tip.sh` → `e9kop4og8` / `index-Di87A4Tc.js`
- Do **not** restore `1hqxwet9z` / `index-B0JBd4cG.js` unless rolling back text-invite onboarding

## Human smoke (remaining)

1. Sign in → `/account/social-onboarding`
2. Step 1 → **Text an invite** opens Messages with menuply.com Dining Crew invite
3. Skip-all completes without error
4. Non-student can skip .edu; student optional .edu still works
