# AUTHORITATIVE HOME PAGE

**This directory contains the production home page.**

| File | Status |
|------|--------|
| `HomeNext.jsx` | **AUTHORITATIVE** — default live home at `/` |
| `HomeRoot.jsx` | Route selector (`HomeNext` default; legacy via flag) |
| `LegacyDiscoveryHome.jsx` | Rollback / legacy only — not the product default |

**Do not modify `HomeNext` or `src/components/homeNext/*` without explicit product-owner approval.**

Full reference: `docs/architecture/2026-06-28_AUTHORITATIVE-HOME-PAGE-DESIGN.md`  
Protection protocol: `docs/guardrails/2026-06-28_home-page-protection-protocol-guardrail.md`
