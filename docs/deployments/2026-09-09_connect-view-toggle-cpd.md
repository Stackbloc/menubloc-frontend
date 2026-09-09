# CPD — Connect View Join Me/Take Me Out + glasses view toggle (2026-09-09)

## Summary

Own-hub Connect View keeps **Join Me / Take Me Out** on cravings. Replaced the logo-obscured Your/Connect pills with a glasses/eyes icon toggle next to Feed More (`?view=connect`).

## Commits / tips

| Layer | Value |
|-------|-------|
| FE feature | `259686a7` |
| FE tip | `menubloc-frontend-d5y8qfytg-menuply.vercel.app` |
| FE bundle | `index-DKO0aJ95.js` |
| BE (unchanged this ship) | tip-lock records `c2952575` |

## Verification

- Contracts: connect view / eating hub / diner activity scan — PASS
- Local `npm run build` — PASS; bundle markers present
- Live apex bundle markers: `profile-view-mode-toggle`, `Join Me / Take Me Out` (×2), Connect view hover title
- `cpd-fe.sh` tip-gate apex + www **RESULT=PASS**

## Verify in product

1. Open https://menuply.com/feed/profile (signed in)
2. Glasses icon next to ☰ — hover explains Connect view; tap → `?view=connect`
3. Under What I Wanna Eat cravings: **Join Me / Take Me Out** still visible
4. Tap again → back to Your view
