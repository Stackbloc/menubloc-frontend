# Menuply Operator Tablet PWA Deploy Test - 2026-06-15

## Deployment

- Preview deployment: `https://menubloc-frontend-dif4w1t3u-andre-barber-s-projects.vercel.app`
- Preview deployment ID: `dpl_4LyJ7JmmXZgGa2PBEB4ujniDiYDF`
- Production deployment: `https://menubloc-frontend-r4t6wdph7-andre-barber-s-projects.vercel.app`
- Production deployment ID: `dpl_5Q6RKjTv2NZxnuiDrTekLXuD9TTm`
- Live test URL: `https://menuply.com/operator/tablet`

## Verified

- Vercel preview build completed successfully.
- Vercel production build completed successfully.
- `https://menuply.com/manifest.webmanifest` returns `200` with:
  - `name`: `Menuply Operator`
  - `short_name`: `Operator`
  - `start_url`: `/operator/tablet`
  - `display`: `standalone`
  - `orientation`: `landscape-primary`
- `https://menuply.com/service-worker.js` returns `200`.
- `https://menuply.com/pwa-icons/operator-icon-512.png` returns `200`.
- Browser check against `https://menuply.com/operator/tablet` redirects unauthenticated users to `https://menuply.com/operator/login`.

## Issues Found

1. Vercel preview deployment is protected by Vercel authentication.
   - Impact: preview URL cannot be used for Android Chrome install testing without Vercel auth access.
   - Evidence: preview `manifest.webmanifest`, `service-worker.js`, icon, and `/operator/tablet` requests returned `401`.
   - Action: deployed the same build to production because the requirement allows staging or production and installability must work from the live frontend domain.

2. Direct Vercel production deployment URL is also protected by Vercel authentication.
   - Impact: use `https://menuply.com/operator/tablet` for tablet testing, not the raw Vercel deployment URL.
   - Evidence: direct deployment URL returned `401`; `menuply.com` assets returned `200`.

3. Local environment cannot drive Andre's Android tablet.
   - Impact: real-device install, home-screen launch, standalone display, audio, and session refresh/reopen behavior are pending physical tablet testing.
   - Evidence: `adb` is not installed in this environment.
   - Action: no code fixes made because no real-device issue has been observed yet.

4. One CLI `curl` fetch to `menuply.com/operator/tablet` hit a transient DNS resolution failure.
   - Impact: browser verification still succeeded; monitor if tablet sees DNS/network instability.
   - Evidence: Playwright browser check loaded the live URL and ended at `/operator/login`.

## Real-Device Checklist Still Pending

- Android tablet Chrome install works from `https://menuply.com/operator/tablet`.
- Home screen icon launches the app.
- Home screen launch opens standalone app view.
- Existing operator account can log in and access `/operator/tablet`.
- Operator login survives normal refresh and app reopen.
- Pending orders display from the live account.
- Accept, Decline, and Print controls are usable by touch.
- Audio and visual alert state works after tapping `Activate Audio Alerts`.
- Offline warning appears when network is disabled.
- Accept and Decline remain blocked while offline.
- Diner-facing pages remain unchanged.

## Fixes After Real-Device Testing

- None. No real-device tablet issue has been observed from this environment.
