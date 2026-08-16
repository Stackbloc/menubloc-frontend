# CPD — About + diner signup food-social copy (2026-08-16)

## Summary

Replaced About Menuply and Diner Signup pitch copy with discover / plan / eat positioning. Form + SMS verification unchanged. FE tip redeployed; BE unchanged.

## Deploy path

| Layer | Path | Branch | Commit | Tree |
|-------|------|--------|--------|------|
| FE | `/Users/andrebarber/Desktop/menubloc/menubloc-frontend-main` | `main` | `f9b0535` | clean after commit |
| BE | — | — | not attempted | — |

## FE tip

- Deployment: `menubloc-frontend-c07vv7d3s-menuply.vercel.app`
- Bundle: `index-BUPZP4ci.js`
- Aliases: `menuply.com`, `www.menuply.com`, `crm.menuply.com`, `venues.menuply.com`
- Tip-gate: PASS (apex + www) after lock update

## BE health

- Unchanged this CPD: `commit_hash` `754b2cf959f817c0be2982aa0d44219a9804cae4`

## Files

- `src/pages/AboutMenuply.jsx`
- `src/pages/consumer/DinerSignup.jsx`
- `src/i18n/remainingCoverageLabels.js` (English about.*)
- `src/lib/sitemapConfig.js`
- `test/aboutAndDinerSignupCopyContract.test.js`

## Verification

- `node --test test/aboutAndDinerSignupCopyContract.test.js tests/dinerPhoneVerificationFlow.test.js` — pass
- Live bundle contains `Food is social.`, `Menuply is different.`, `Discover. Plan. Eat.`
- No `Food Intelligence for Everyone` / `small fortune` in live bundle strings checked

## Prior tip (restore if needed)

`menubloc-frontend-fnn23dmbl-menuply.vercel.app` / `index-UMv0E4Zu.js` (Phase 7)
