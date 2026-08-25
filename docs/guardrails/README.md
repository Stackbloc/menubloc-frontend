# Guardrails Index

Dated guardrail documents for Menuply agents and reviewers.

| Date | Topic | File |
|------|-------|------|
| 2026-08-25 | **🔴 End-to-end verification completion (REQUIRED)** — no Fixed/Complete without live hops incl. DB/media; reuse only when prior audit/handoff already certified same path | [2026-08-25_end-to-end-verification-completion-contract.md](2026-08-25_end-to-end-verification-completion-contract.md) |
| 2026-08-24 | **Home food search parameters — no changes to search** — HomeNext food search params locked without Andre approval | [2026-08-24_home-food-search-parameters-no-changes-contract.md](2026-08-24_home-food-search-parameters-no-changes-contract.md) |
| 2026-08-24 | **🔴 Production tip lock atomic (REQUIRED)** — after FE alias: lock tip-gate → tip-gate PASS → sync LKG; never panic-restore on `bundle != locked tip` alone | [2026-08-24_production-tip-lock-atomic-contract.md](2026-08-24_production-tip-lock-atomic-contract.md) |
| 2026-08-20 | **CPD agent playbook** — short Commit→Push→Deploy procedure + traps (sandbox, alias, tip-lock order) | [2026-08-20_cpd-agent-playbook.md](2026-08-20_cpd-agent-playbook.md) |
| 2026-08-19 | **Join Me vs Invite Me** — Join Me = future plans (per-instance eligibility); Invite Me = Food I Want to Eat (diner-set invite eligibility); do not swap | [2026-08-19_join-me-vs-invite-me-vocabulary.md](2026-08-19_join-me-vs-invite-me-vocabulary.md) |
| 2026-08-19 | **Consumer visitor analytics (owner reporting)** — one unique-visitor model; Unattributed row; timezone; dashboard + Site Activity + Geo must reconcile | [2026-08-19_consumer-visitor-analytics-contract.md](2026-08-19_consumer-visitor-analytics-contract.md) |
| 2026-08-17 | **Guest open reporting** — anyone can contribute; accounts unlock identity/social; no login wall on IEA/diner-status | [2026-08-17_guest-open-reporting-contract.md](2026-08-17_guest-open-reporting-contract.md) |
| 2026-08-15 | **Dining hall experience-only** — no menu/item analysis; status reports + comments only; menu data not required (clarified 2026-08-17) | [2026-08-15_dining-hall-experience-only-no-menus.md](2026-08-15_dining-hall-experience-only-no-menus.md) |
| 2026-08-15 | **Production Working Features Only** — never ship UI for features that do not work; hide until live | [2026-08-15_production-working-features-only-contract.md](2026-08-15_production-working-features-only-contract.md) |
| 2026-08-14 | **Production deploy + LKG registry (REQUIRED)** — current tip/BE SHA; use [CPD playbook](2026-08-20_cpd-agent-playbook.md) for ship steps | [2026-08-14_production-deploy-and-lkg-contract.md](2026-08-14_production-deploy-and-lkg-contract.md) |
| 2026-08-14 | **Consumer share Menuply URL** — absolute menuply.com only; Copy Link first; reject share.google | [2026-08-14_consumer-share-menuply-url-contract.md](2026-08-14_consumer-share-menuply-url-contract.md) |
| 2026-08-10 | **Site Footer Protection Contract** — never remove/blank public SiteFooter (incl. home) without explicit confirmation; business-activity gateway | [2026-08-10_site-footer-protection-contract.md](2026-08-10_site-footer-protection-contract.md) |
| 2026-07-30 | **Menu Capture Worker Protection Contract** — production OCR worker stays on; disable only with Andre + `ALLOW_DISABLE_MENU_CAPTURE_WORKER=1` | [2026-07-30_menu-capture-worker-protection-contract.md](2026-07-30_menu-capture-worker-protection-contract.md) |
| 2026-07-30 | **Dunkin' no alcoholic cocktails** — "cocktail" menu copy / Old Fashioned Donut must not map to Yellow Browser cocktails | [2026-07-30_dunkin-no-alcoholic-cocktails-guardrail.md](2026-07-30_dunkin-no-alcoholic-cocktails-guardrail.md) |
| 2026-07-28 | **Menuply Search Execution Contract (REQUIRED)** — geo→restaurant→menu→item; no text-before-geography; PR/regression gates | [2026-07-28_menuply-search-execution-contract.md](2026-07-28_menuply-search-execution-contract.md) |
| 2026-07-28 | **Backend production deploy path contract** — only `menubloc-backend-main` @ clean `main` | [2026-07-28_backend-production-deploy-path-contract.md](2026-07-28_backend-production-deploy-path-contract.md) |
| 2026-07-24 | **Frontend production deploy path contract** — only `menubloc-frontend-main` @ clean `main` unless Andre names an exception; mandatory FE DEPLOY PATH CERTIFICATION · **CPD:** [../deployments/2026-07-24_frontend-production-deploy-path-contract-cpd.md](../deployments/2026-07-24_frontend-production-deploy-path-contract-cpd.md) | [2026-07-24_frontend-production-deploy-path-contract.md](2026-07-24_frontend-production-deploy-path-contract.md) |
| 2026-07-23 | **Stripe Environment Protection Contract** — production stays live; sandbox only with Andre’s explicit per-task permission | [2026-07-23_stripe-environment-protection-contract.md](2026-07-23_stripe-environment-protection-contract.md) |
| 2026-07-15 | **Operator login AuthPageFrame** — zero-touch green Sign in; no PageShell/blue redesign | [2026-07-15_operator-login-auth-page-frame-guardrail.md](2026-07-15_operator-login-auth-page-frame-guardrail.md) |
| 2026-07-05 | **Frontend API base URL** — no same-origin `/menus/browse` on menuply.com | [2026-07-05_frontend-api-base-url-guardrail.md](2026-07-05_frontend-api-base-url-guardrail.md) |
| 2026-06-18 | Franchise search/discovery completion gate | [2026-06-18_franchise-search-discovery-completion-gate.md](2026-06-18_franchise-search-discovery-completion-gate.md) |
| 2026-06-23 | Single restaurant resolution per upload | [2026-06-23_single-restaurant-resolution-per-upload-guardrail.md](2026-06-23_single-restaurant-resolution-per-upload-guardrail.md) |
| 2026-06-23 | Canonical menu item object protection | [2026-06-23_canonical-menu-item-object-protection-guardrail.md](2026-06-23_canonical-menu-item-object-protection-guardrail.md) |
| 2026-06-23 | Canonical Menu Item Platform (ADR-001) | [../architecture/ADR-001-Canonical-Menu-Item-Platform.md](../architecture/ADR-001-Canonical-Menu-Item-Platform.md) |
| 2026-06-26 | Franchise public display name + MKS menu order | [2026-06-26_franchise-public-display-name-mks-menu-order-guardrail.md](2026-06-26_franchise-public-display-name-mks-menu-order-guardrail.md) |
| 2026-06-28 | **Public menu shell protection** — CK requires published `public.menus`; P2-CK-07 | [2026-06-28_public-menu-shell-protection-guardrail.md](2026-06-28_public-menu-shell-protection-guardrail.md) |
| 2026-06-28 | **Home Page Protection Protocol (HPP)** — authoritative HomeNext | [../menubloc-frontend/docs/guardrails/2026-06-28_home-page-protection-protocol-guardrail.md](../menubloc-frontend/docs/guardrails/2026-06-28_home-page-protection-protocol-guardrail.md) · design: [../menubloc-frontend/docs/architecture/2026-06-28_AUTHORITATIVE-HOME-PAGE-DESIGN.md](../menubloc-frontend/docs/architecture/2026-06-28_AUTHORITATIVE-HOME-PAGE-DESIGN.md) |

Cursor rules in `.cursor/rules/` mirror the active guardrails for always-on agent enforcement.
