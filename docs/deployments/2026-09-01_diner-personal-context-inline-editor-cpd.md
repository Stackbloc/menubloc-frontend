# CPD — Inline personal context editor on profile (2026-09-01)

## Summary
Profile owners can edit class year, occupation, major, and hometown directly on `/feed/profile` via `DinerPersonalContextEditor`. Viewers on connection peer pages remain read-only (`readOnly` + no `onPersonalContextSave`).

## Deploy path
| Layer | Path | Branch | Commit | Gate |
|-------|------|--------|--------|------|
| FE feature | menubloc-frontend-main | main | `8531375f` | tip-gate PASS |
| FE tip lock | menubloc-frontend-main | main | `e77c2e06` | docs-only |
| BE | menubloc-backend-main | main | `f642a6fa` | unchanged this CPD |

## Production tip
- Deployment: `menubloc-frontend-nrxgr1fdu-menuply.vercel.app`
- Bundle: `index-CObKtVBQ.js`
- Tip-gate: PASS apex + www
- Aliases: menuply.com, www, crm, venues

## Verify
1. **Owner** — `/feed/profile` → About Me → **Personal context** panel with four inputs; blur saves.
2. **Viewer** — `/account/connections/:peerId` → no editor; only display lines if peer filled fields.
3. Bundle: `curl -s https://menuply.com/assets/index-CObKtVBQ.js | grep -c diner-personal-context-editor` → ≥ 1

## Rollback
Prior tip: `menubloc-frontend-qqcqs5327-menuply.vercel.app` / `index-CwJ1D9gj.js`
