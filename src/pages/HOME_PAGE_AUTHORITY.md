# AUTHORITATIVE HOME PAGE

**This directory contains the production home page.**

| File | Status |
|------|--------|
| `consumer/feed/FeedHomePage.jsx` + `FeedShellPage.jsx` | **AUTHORITATIVE** — default live home at `/` (FeedPrimaryNav unchanged) |
| `HomeNext.jsx` | Preserved at `/home-next`; rollback home via `VITE_FEED_AS_HOME=0` |
| `HomeRoot.jsx` | Route selector (`Feed` default; HomeNext/legacy via flags) |
| `LegacyDiscoveryHome.jsx` | Rollback / legacy only — not the product default |

**Do not modify `HomeNext` or `src/components/homeNext/*` without explicit product-owner approval.**

Full reference: `docs/architecture/2026-06-28_AUTHORITATIVE-HOME-PAGE-DESIGN.md`  
Protection protocol: `docs/guardrails/2026-06-28_home-page-protection-protocol-guardrail.md`
