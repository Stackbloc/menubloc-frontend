# CPD — Feed center X video create + plan video attach (2026-08-26)

## Summary

Feed shell center **X** opens video-only I'm Eating / Wanna Eat compose; plan rows get **Add plan video** via what-we-doing PATCH. BE exposes `photo_url` / `video_url` on plan sessions.

## Deploy path

| Layer | Path | Branch | Commit | Gate |
|-------|------|--------|--------|------|
| FE | menubloc-frontend-main | main | `0546f98` | tip-gate PASS |
| BE | menubloc-backend-main | main | `985f1dcb` | health match |

## Production tip

- Deployment: `menubloc-frontend-dy1boxufn-menuply.vercel.app`
- Bundle: `index-Wxgt5_-3.js`
- Tip-gate: **PASS** apex + www
- Prior tip (rollback): `6uj8rufl4` / `index-COekEjGi.js`

## Verify

1. https://menuply.com/feed — bottom nav shows center **X** (not top +)
2. Tap X → "Post video to Feed" → I'm Eating or Wanna Eat only
3. Signed-in: record video → post → feed reloads
4. My Menuply → plan without video → **Add plan video** → upload → PATCH succeeds
5. BE health `commit_hash` = `985f1dcb…`

## Rollback

```bash
npx vercel alias set menubloc-frontend-6uj8rufl4-menuply.vercel.app menuply.com
# + www/crm/venues; lock tip-gate to prior bundle index-COekEjGi.js
```

BE rollback: redeploy `2d76cab1` if plan PATCH must be reverted (additive only).
