# CPD — CSP connect-src allow Supabase signed PUTs (2026-09-10)

## Problem
After Cause 2 (browser PUT to signed Supabase URLs), **all** diner video uploads and Video Manager uploads failed in ~1s with the weak-cellular toast. Live `Content-Security-Policy` `connect-src` allowed Railway but **not** `*.supabase.co`, so the browser blocked the XHR before bytes moved.

## Ship
| Layer | Value |
|-------|-------|
| FE commit | `a88f2f76` |
| FE tip | `menubloc-frontend-f6afbgfcx-menuply.vercel.app` / `index-DJM3h8AZ.js` |
| Change | `vercel.json` CSP `connect-src` += `https://*.supabase.co` + contract test |
| BE | unchanged |

## Tip-gate
```
apex/www RESULT=PASS — menubloc-frontend-f6afbgfcx-menuply.vercel.app / index-DJM3h8AZ.js
```

## Live CSP proof (post-alias)
`connect-src` on `https://menuply.com` includes `https://*.supabase.co`.

## Verify (human)
Hard-refresh, then retry Multiplier / Feed video upload and Video Manager. Photos still use Railway multipart (already allowlisted) — video Cause-2 PUT was the broken hop.

## Note
Same JS bundle hash as prior tip is expected: CSP is a Vercel header, not a Vite asset change.
