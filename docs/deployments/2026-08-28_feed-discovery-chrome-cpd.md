# CPD — Feed discovery chrome + signup screen name (2026-08-28)

## Summary

Shipped responsive Feed discovery: desktop left rail, mobile More drawer, guest Profile cards, shared `feedShellLinks` map (Waiter, Clusters, businesses, account). Signup collects optional screen name with First L. default hint. Feed profile embed hides duplicate BottomNav.

## Deploy path

| Layer | Path | Branch | Commit | Gate |
|-------|------|--------|--------|------|
| FE | menubloc-frontend-main | main | `bd3c661` | tip-gate PASS (pending) |
| BE | — | — | unchanged | n/a |

## Verify

1. https://menuply.com/ — Feed home (desktop: left rail + Log in/Sign up; mobile: top Log in + ☰ More)
2. More → Waiter, Clusters, Restaurants, Account settings
3. /feed/profile as guest → Join / Clusters / Waiter cards
4. /diner/signup — first/last name + optional screen name
5. Signed-in /feed/profile — no duplicate BottomNav

## Rollback

Prior tip: `menubloc-frontend-ejhmbjzgh-menuply.vercel.app` / `index-F4Sczbnh.js`
