# CPD: Diner QR blank card CORP + Invite dialog align — 2026-08-16

## Summary

Shipped hotfix so Personal Diner Card QR is visible on menuply.com (same-origin `/d/{token}/image`) and Invite to Eat selected options are aligned.

## Deploy path

| Layer | Path | Commit | Notes |
|-------|------|--------|-------|
| BE | `menubloc-backend-main` @ clean `main` | `45123b8c` | `Cross-Origin-Resource-Policy: cross-origin` on successful `/d/:token/image` |
| FE | `menubloc-frontend-main` @ clean `main` | `42c415b` (tip build ancestry; deploy from tree including this fix) | Same-origin QR `src`; Invite radio grid |

## Tip / health

| Check | Result |
|-------|--------|
| FE tip | `menubloc-frontend-e2toazdpi-menuply.vercel.app` |
| Live bundle | `index-Cx2bTWAc.js` |
| Aliases | menuply.com, www, crm, venues |
| Tip-gate | PASS expected after lock update |
| BE health `commit_hash` | `45123b8c…` |
| Bundle probe | `diner-qr` present; `/d/${encodeURIComponent(String(T))}/image` in bundle |

## Unrelated WIP

Venue Phase 3 / dining-crew tip-doc edits were stashed aside during deploy and should be restored after CPD (not part of this ship).

## Human verify

1. Sign in → Account → My Diner QR → QR PNG visible (not white blank)
2. Invite to Eat → option radios/checkboxes sit square in selected rows
