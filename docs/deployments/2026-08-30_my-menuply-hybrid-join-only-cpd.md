# CPD — My Menuply hybrid polish + join-only profile cards (2026-08-30)

## Summary
Shipped My Menuply section hierarchy polish (kickers, inline day nav, meal hero cards) and removed Invite actions from profile hub cards so readers only see Join / Request to join.

## Deploy path
| Layer | Path | Branch | Commit | Gate |
|-------|------|--------|--------|------|
| FE | menubloc-frontend-main | main | fc1581a | tip-gate PASS |
| BE | menubloc-backend-main | main | d4755be4 | health unchanged |

## Production tip
- Deployment: menubloc-frontend-7o8uq6y32-menuply.vercel.app
- Bundle: index-CjGGZd0J.js
- Tip-gate: PASS apex + www
- Railway API refs in bundle: 61 · localhost: 10

## Verify
1. https://menuply.com/account/my-menuply — section kickers, inline day nav, meal hero on first item with media
2. Profile crew/event cards — no Invite button; owner invites via X → Plan & Invite
3. Eating plans — Join Me still on joinable rows
4. Peer profile — Request to join on public crews

## Rollback
Prior tip `menubloc-frontend-odgqdr6lw-menuply.vercel.app` / `index-BTxsHPk2.js`
