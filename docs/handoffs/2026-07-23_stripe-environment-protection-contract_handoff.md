# Objective

Establish the Stripe Environment Protection Contract as a mandatory, always-on Menuply guardrail so agents cannot switch production to Stripe sandbox/test without Andre Barber’s explicit per-task permission.

# Current Status

**CPD COMPLETE (docs + agent rules).**  
- Backend `main` `37cc3131` pushed  
- Frontend `main` `166fb3b` pushed  
- Vercel/menuply.com runtime deploy **skipped** (no runtime change)  
- Production Stripe env **unchanged live** — no sandbox switch

No production Stripe configuration, Railway/Vercel env vars, webhooks, or payment code were changed in this task.

# Files Changed

- `docs/guardrails/2026-07-23_stripe-environment-protection-contract.md` — full contract (authoritative)
- `.cursor/rules/stripe-environment-protection-guardrail.mdc` — alwaysApply Cursor rule
- `docs/guardrails/README.md` — index entry
- `CLAUDE.md` — absolute production-safety section + certification line
- `docs/handoffs/2026-07-23_stripe-environment-protection-contract_handoff.md` — this handoff
- `docs/handoffs/README.md` — index entry

# Database Changes

None.

# Decisions Made

- Codify the user-supplied contract verbatim as the guardrail source of truth.
- Enforce via alwaysApply Cursor rule + CLAUDE.md absolute section (same pattern as Waiter / Operator Login).
- Require ☐ STRIPE ENVIRONMENT CERTIFICATION on every task completion.
- Do **not** implement §11 runtime assertion in this pass (recommended, not required for contract adoption); track as follow-up so production payment startup behavior is audited before adding fail-hard checks.

# Remaining Work

1. Optional: implement fail-closed production runtime guard (§11) in Stripe client init — audit current env var names (`STRIPE_MODE`, key prefixes) against Railway first.
2. Optional: add a non-destructive production live-mode smoke probe script that reports mode without exposing secrets.
3. Commit when Andre requests (not committed in this session unless asked).

# Risks / Known Issues

- Contract is agent-process enforced today; missing runtime assertion means misconfigured production env could still load test keys until §11 is implemented.
- Worktree clones (`menubloc-backend-*`, `menubloc-frontend-*`) do not automatically receive this guardrail unless they share the monorepo root `.cursor/rules` / `CLAUDE.md`.

# Verification Status

- Guardrail file present and indexed.
- Cursor rule `alwaysApply: true`.
- CLAUDE.md absolute section present.
- **No** production Stripe env changes performed or verified (none needed).

# Resume Instructions

1. Read `docs/guardrails/2026-07-23_stripe-environment-protection-contract.md`.
2. For any Stripe/payment work: prefer local/test/preview; never touch production live→sandbox without Andre’s exact permission sentence.
3. If implementing §11: inventory live Railway Stripe env var names first; fail closed; never log secrets.

# Git Status

Uncommitted local docs/rule changes only (as of handoff creation). No deploy.
