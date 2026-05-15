# SECURITY_HEADERS.md — Frontend Security Headers

**Date:** 2026-05-15  
**Branch:** security/baseline-hardening-v1  
**File:** `vercel.json`

---

## Headers Applied (all routes)

### Strict-Transport-Security
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```
- Forces HTTPS for 1 year on all subdomains.
- `preload` flag: eligible for browser HSTS preload lists after submission.

### X-Frame-Options
```
X-Frame-Options: DENY
```
- Prevents Menuply pages from being embedded in any `<iframe>`, blocking clickjacking attacks.

### X-Content-Type-Options
```
X-Content-Type-Options: nosniff
```
- Prevents browsers from MIME-sniffing a response away from the declared Content-Type.

### Referrer-Policy
```
Referrer-Policy: strict-origin-when-cross-origin
```
- Sends full referrer for same-origin requests, only the origin for cross-origin. Balances analytics accuracy with privacy.

### Permissions-Policy
```
Permissions-Policy: camera=(), microphone=(), payment=(self), geolocation=(self), fullscreen=(self)
```
- `camera=()` and `microphone=()`: disabled entirely (no feature uses them).
- `payment=(self)`: Stripe checkout is hosted on the same origin.
- `geolocation=(self)`: discovery page uses browser geolocation.
- `fullscreen=(self)`: standard SPA allowance.

### X-XSS-Protection
```
X-XSS-Protection: 1; mode=block
```
- Legacy IE/old-Chrome mitigation. Modern browsers use CSP instead; this header is harmless on modern browsers.

### Content-Security-Policy
```
default-src 'self';
script-src 'self' 'unsafe-inline' https://js.stripe.com https://www.googletagmanager.com https://www.google-analytics.com https://app.posthog.com https://va.vercel-scripts.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data: blob: https:;
connect-src 'self' https://menubloc-backend-production.up.railway.app https://api.stripe.com https://www.google-analytics.com https://analytics.google.com https://region1.google-analytics.com https://app.posthog.com https://vitals.vercel-insights.com https://va.vercel-scripts.com wss:;
frame-src https://js.stripe.com https://hooks.stripe.com;
worker-src 'self' blob:;
object-src 'none';
base-uri 'self';
form-action 'self'
```

**Why `unsafe-inline` for scripts:** The app uses Vite with inline runtime chunks and the GA/GTM snippets inject inline scripts. Removing `unsafe-inline` would require nonce-based CSP (needs server-side rendering or middleware injection) — deferred to a future phase.

**`img-src https:`** — menu item images come from varied external domains (restaurant CDNs, Google Places photos, etc.). Restricting to specific hostnames would break menu image rendering.

### X-Robots-Tag (preview/staging only)
```
X-Robots-Tag: noindex, nofollow
```
- Applied to all non-menuply.com hosts (i.e., all `*.vercel.app` preview deployments).
- Prevents search engines from indexing staging/preview builds.

---

## What Was Not Changed

| Header | Reason |
|--------|--------|
| `Content-Security-Policy` nonce-based | Requires SSR or edge middleware; Vite SPA cannot inject per-request nonces |
| Removing `unsafe-inline` from scripts | Vite runtime chunks and GTM require it; needs migration to nonce/hash-based approach |

---

## Next-Phase Improvements

1. **Move to nonce-based CSP** — Requires Vercel edge middleware to inject a per-request nonce into both the HTML `<script>` tags and the CSP header. This eliminates `unsafe-inline`.
2. **Add Content-Security-Policy-Report-Only** first to catch violations before enforcing a stricter policy.
3. **Add `report-uri`** or `report-to` endpoint to capture CSP violations in production.
