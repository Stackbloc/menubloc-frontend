# CPD — My Menuply Connects + Post about deep links (2026-08-19)

## Summary

Bottom-nav **Post about** aligned with today's eat model: I'm Eating At, What I Ate / Want / Plan (My Menuply compose), Invite to Eat, My Connects, Find events. Share Food removed. Stats **Friends → Connects** (selectable). Restaurant + menu item or Homemade place fields; auto-follow on restaurant selection.

## Deploy path

| Layer | Path | Branch | Commit |
|-------|------|--------|--------|
| FE | `menubloc-frontend-main` | `main` | `9196bfc` |
| BE | `menubloc-backend-main` | `main` | unchanged this CPD (`8c4b9391` live) |

- BE path-gate: **PASS** @ `8c4b9391` (no BE push)
- FE: `vercel --prod` → alias menuply.com + www + crm + venues

## Production verification

| Check | Result |
|-------|--------|
| FE tip | `menubloc-frontend-gp1hon3it-menuply.vercel.app` / `index-BshpJpXB.js` |
| Tip-gate apex + www | **PASS** |
| Railway `/health` `commit_hash` | **MATCH** `8c4b9391` (no BE code change) |
| Bundle API probe | railway=60, localhost=9 |

## Human verify

1. Bottom nav **Post** → Post about: I'm Eating At, What I Ate, Want to Eat, Plan to Eat, Invite to Eat, My Connects, Find events (no Share Food).
2. https://menuply.com/my-menuply — stats show **Connects** (selectable); compose ate/want/plan with restaurant or Homemade.
3. Deep links: `/my-menuply?compose=ate`, `?focus=connects`.

## Rollback

```bash
npx vercel alias set menubloc-frontend-i5s4ory3h-menuply.vercel.app menuply.com
# (+ www, crm, venues)
```

Prior tip: `i5s4ory3h` / `index-9GkHkqdL.js` (diner roster layout; pre–Connects/Post about).
