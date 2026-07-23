# CPD — Stripe Environment Protection Contract

**Date:** 2026-07-23  
**Feature:** Mandatory production Stripe live-mode guardrail (docs + agent rules). No runtime payment code or Stripe env changes.

## Commits

| Repo | Branch | Commit | Notes |
|------|--------|--------|-------|
| menubloc-backend | `main` | `37cc3131` | Guardrail + CLAUDE.md + handoff |
| menubloc-frontend | `main` | `166fb3b` | Guardrail + CLAUDE.md + Cursor rule + handoff |

Workspace (not a git root): `docs/guardrails/`, `.cursor/rules/`, root `CLAUDE.md` already updated locally.

## Deploy steps

1. **Backend** — `git push origin main` (docs-only; Railway may redeploy identical runtime)
2. **Frontend** — `git push origin main` (docs-only)
3. **Vercel / menuply.com** — **SKIPPED** — no frontend runtime change; alias not updated
4. **Railway Stripe env** — **UNCHANGED** — production remains live; no sandbox switch

## Verification

| Check | Result |
|-------|--------|
| Production Stripe env vars altered | **No** |
| Production webhook endpoints altered | **No** |
| menuply.com redeployed | **No** (not required) |
| Guardrail present in BE/FE repos | Yes (post-commit) |
| Agent alwaysApply Cursor rule | Yes (workspace + FE `.cursor/rules/`) |

## Stripe mode statement

Stripe production configuration was **not** modified. Production remains live. No temporary sandbox configuration was activated.

## Human verify (optional)

- Confirm agents load `.cursor/rules/stripe-environment-protection-guardrail.mdc`
- Confirm `docs/guardrails/2026-07-23_stripe-environment-protection-contract.md` exists in BE/FE after pull
