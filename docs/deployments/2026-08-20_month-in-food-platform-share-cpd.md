# CPD — Month in Food platform share (2026-08-20)

## Summary

Route Month in Food share through platform `ShareButton` + `buildConsumerPathShareData` (`shareUtils`) so Copy Link always emits `https://menuply.com/...`. Also adds the CPD agent playbook so future ships stay short.

## Deploy path

| Layer | Path | Branch | Commit | Tree | Gate |
|-------|------|--------|--------|------|------|
| FE | `menubloc-frontend-main` | `main` | `cbc7728` | clean at deploy | tip-gate PASS |
| BE | unchanged | — | live `5f06246f` | — | health only |

## Production tip

- Deployment: `menubloc-frontend-6nzh7hvv5-menuply.vercel.app`
- Bundle: `index-RmW9q_Gr.js`
- Aliases: `menuply.com`, `www.menuply.com`, `crm.menuply.com`, `venues.menuply.com`
- Tip-gate: PASS apex + www

## Verify

1. Month in Food → share icon → Copy Link shows `https://menuply.com/my-menuply/month-in-food?ym=…`
2. Footer Share uses the same ShareModal (not a custom Copy Link-only control)

## Rollback

Restore prior tip `k2hpeyh3s` / `index-DygwUgB7.js` (My Menuply hub access).

## Agent note

Playbook: `docs/guardrails/2026-08-20_cpd-agent-playbook.md`
