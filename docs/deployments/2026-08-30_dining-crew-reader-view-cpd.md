# CPD — Dining crew reader vs member detail views (2026-08-30)

## Summary
Split `/account/dining-crews/:id` into a simple reader view (name, description, members, Request to join) and a member/owner management console. Backend now returns member roster on public crew GET for non-members.

## Deploy path
| Layer | Path | Branch | Commit | Gate |
|-------|------|--------|--------|------|
| FE | menubloc-frontend-main | main | c999edc | tip-gate PASS |
| BE | menubloc-backend-main | main | 5fa1b866 | health + smoke PASS |

## Production tip
- Deployment: menubloc-frontend-95awupahy-menuply.vercel.app
- Bundle: index-Clo0zd76.js
- Tip-gate: PASS apex + www
- Railway API refs in bundle: 62 · localhost: 10

## Verify
1. Owner: https://menuply.com/account/dining-crews/2 — member view with invite/conversations
2. Connection (non-member): same URL on public crew — reader view only, members listed, Request to join
3. GET `/api/consumer/dining-crews/:id` as non-member returns `members` array on public crews

## Rollback
Prior tip `menubloc-frontend-7o8uq6y32-menuply.vercel.app` / `index-CjGGZd0J.js`
