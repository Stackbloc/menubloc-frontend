# Terms of Use Final Legal Refinement Review

**Date:** 2026-07-19  
**Subject:** Final Terms of Use legal refinement (no functional / product / business-policy changes)  
**Source file:** `menubloc-frontend/src/content/legal.js` (`TERMS_DOCUMENT`, `LEGAL_CONTACT`, Terms version/effective date)  
**Public surface:** https://menuply.com/terms  
**Scope:** Legal text refinement only  

---

## Summary

Performed a scoped legal refinement of the Menuply Terms of Use. Changes were limited to: (1) California corporate identification; (2) concise reservation-of-rights and informational-disclaimer additions that avoid proprietary implementation detail; (3) Terms version / effective-date bump to match the revision. No commission, pricing, subscription, arbitration, liability-limit amounts, payment, merchant-of-record, privacy-body, or ordering-workflow provisions were rewritten.

---

## Changes Made (exact locations)

### Metadata / Legal Entity

| Change | Location |
|--------|----------|
| Effective date `2026-07-07` → `2026-07-19` | `LEGAL_EFFECTIVE_DATE` |
| Terms version `terms_of_use_v2026_07_07` → `terms_of_use_v2026_07_19` | `LEGAL_VERSIONS.consumerTerms` |
| Company string → `Stackbloc Corporation, a California corporation` | `LEGAL_CONTACT.company` (drives **Legal entity** footer on legal pages) |

### 1. Corporate Identification

Replaced `Stackbloc Corporation` with `Stackbloc Corporation, a California corporation` in:

| Section | Field |
|---------|--------|
| Document description (Title / hero) | `TERMS_DOCUMENT.description` |
| Overview | first paragraph |
| Operator and platform role | first paragraph |
| Restaurant Partner Terms | opening paragraph; liability-cap paragraph (grammar: “the total liability of Stackbloc Corporation, a California corporation, …”) |
| Disclaimers | first paragraph |
| Limitation of liability | first and third paragraphs |
| Contact | sole paragraph |

Business name / DBA (“Menuply”) unchanged. Privacy / Merchant / Subscription document bodies were **not** bulk-updated (out of Terms-of-Use scope), aside from the shared Legal entity footer via `LEGAL_CONTACT`.

### 2. Operator and Platform Role

| Change | Location |
|--------|----------|
| Added one paragraph on organizing / classifying / enhancing / summarizing / estimating / processing via proprietary technologies and automated systems | Third paragraph under **Operator and platform role** |

No references to AI, ML, Common Knowledge, MKS, semantic search, or architecture.

### 3. Restaurant Information

| Change | Location |
|--------|----------|
| Added paragraph that displayed information may differ from restaurant-supplied info and may reflect updates, automated processing, or other lawful sources | Second paragraph under **Restaurant Information and Verification Status** |

### 4. Verification Status

| Change | Location |
|--------|----------|
| Expanded existing verification disclaimer with one sentence: verification is not endorsement, inspection, certification, or a guarantee of restaurant quality, food safety, or legal compliance | Same section; verification-status paragraph (after participation-level sentence) |

### 5. Search Results and Recommendations (new)

| Change | Location |
|--------|----------|
| New short section: search results, rankings, recommendations, classifications, and informational displays use proprietary methods and may change without notice; no guarantee of placement or visibility | New section after Restaurant Information; before Restaurant Partner Terms |

No ranking-method disclosure.

### 6. Nutrition Section

| Change | Location |
|--------|----------|
| Added paragraph that certain information may be generated, estimated, categorized, summarized, enhanced, or otherwise processed using automated systems; informational only | **Nutrition, dietary, and allergen information** (inserted after existing estimates paragraph; before “general informational purposes” paragraph) |

No AI language added.

### 7. Platform Availability (new)

| Change | Location |
|--------|----------|
| Brief reduced-functionality statement for maintenance, outages, security events, third-party interruptions while core services may remain available | New section after Disclaimers; before Limitation of liability |

### 8. Franchise Locations (new)

| Change | Location |
|--------|----------|
| Same-brand locations may differ in ownership, menus, pricing, promotions, participation, availability; one location does not represent all | New section after Restaurant independence; before Restaurant Information |

### 9. User Reports (new)

| Change | Location |
|--------|----------|
| Users may submit corrections, updates, closure reports, similar info; Menuply may review, edit, reject, delay, or remove in sole discretion | New section after Search Results; before Restaurant Partner Terms |

### 10. Future Products and Services (new)

| Change | Location |
|--------|----------|
| Reservation of rights to introduce / modify / suspend / replace / discontinue products, services, subscriptions, marketplace features, advertising, creator services, business tools, other functionality, subject to applicable law | New section after Dispute resolution; before Changes to these terms |

---

## Confirmations

### No unrelated provisions modified

Unchanged (substance preserved):

- Commission rules and Base Price / Current Price economics  
- Pricing integrity / ~15% guideline  
- Subscription and introductory-rate terms  
- Arbitration / class-action waiver / opt-out  
- Liability dollar caps (US $100 / fees paid) — only corporate identifier appended  
- Payment / Stripe language  
- Merchant of record language  
- Privacy Policy body text  
- Ordering / refund / delivery workflows  

### No proprietary implementation details disclosed

Confirmed absent from new or substituted Terms language:

- Common Knowledge / CK  
- MKS  
- Ontology  
- Semantic search  
- AI / machine learning architecture  
- Menu normalization / data pipelines  
- Proprietary algorithms or internal technology names  
- Menu intelligence system internals  

New language is limited to generic legal reservations (“proprietary technologies,” “automated systems,” “proprietary methods”) without describing how systems work.

### Legal refinement only

This was a **legal refinement only**. No business rules, product behavior, pricing, commissions, or platform policy economics were changed. No functional code paths outside Terms content / consent version string were modified.

---

## Files Examined / Changed

**Examined:** `menubloc-frontend/src/content/legal.js`, `menubloc-frontend/src/components/legal/LegalDocumentPage.jsx`, `menubloc-frontend/src/pages/Terms.jsx`, `menubloc-frontend/src/lib/legalConsent.js`  

**Changed:**  
- `menubloc-frontend/src/content/legal.js` — Terms body + `LEGAL_CONTACT` + Terms version/date  
- `docs/audits/TERMS_OF_USE_FINAL_REVIEW.md` — this audit  
- `docs/audits/README.md` — index entry  

---

## Follow-up (same day): Commission language simplification

**Date:** 2026-07-19  
**User direction:** Replace hard-to-understand commission terms with language similar to other third-party platforms (generic marketplace style). Explicit approval: remove Base Price / Current Price / grace-period machinery.

### Removed from Restaurant Partner Terms

- Base Price / Current Price commission administration  
- Commission grace period / protection thresholds  
- Asserted Base Price reject/adjust/reset mechanics  
- Free-vs-paid tier commission narrative, launch activation thresholds  
- 24-month introductory marketplace commission rate detail  
- Commission stability period with 30–180 day notice range  
- Proprietary “commission calculations / Base Price determinations…” paragraph  
- “Revoke benefits including commission protection” phrasing  

### Replaced with (plain marketplace style)

Three short paragraphs:

1. Menuply may charge commission, service fees, subscription fees, or other fees; types/rates disclosed at plan enrollment / ordering enablement / restaurant agreement; may vary by plan, market, order type, or disclosed factors.  
2. Rates/fees may change with advance notice; immediate change allowed for fraud, legal, payment processing, security, or platform integrity.  
3. No guarantee of specific rate, fee amount, order volume, ranking treatment, or economic outcome unless separately agreed in writing.

### Preserved (not rewritten)

- Opening Restaurant Partner Terms (merchant of record)  
- Restaurant update responsibilities  
- Sustainability / non–high-markup design language  
- ~15% in-store price integrity guideline (pricing rule, not commission %)  
- Pricing-concern enforcement remedies (minus “commission protection”)  
- Arbitration and restaurant liability-cap paragraphs  

### Follow-up: Commission disclosed before subscription fee

**User direction:** Commissions must be disclosed before subscription fee amounts (all plan paths including free/$0). Use live plan catalog commission % (fallback = backend catalog BPS). Terms + UI.

**Terms (`TERMS_DOCUMENT` Restaurant Partner Terms):** rewrote fee paragraph to require marketplace commission disclosure before each plan’s subscription fee is shown, including free/$0 plans. Version → `terms_of_use_v2026_07_19_commission_before_sub`.

**UI (commission line appears above subscription price):**
- `SubscriptionSelect.jsx` (`/pricing`, `/restaurant/subscription`)
- `RestaurantSignupEntry.jsx` (plan cards + billing cadence)
- `FoodTruckSignup.jsx`
- `OperatorSubscription.jsx`
- `PlanComparisonTable.jsx` (commission above prices in header)

**Rates (bps → %):** Pro 1100 → **11%**; Founder's / Food Truck 800 → **8%**; Starter free → no order commission (ordering not included). Sourced from `GET /api/stripe/platform/plans` with catalog-aligned fallback; checkout bodies still forbid client-supplied commission fields.

**My Account Settings:** `OperatorMyAccount.jsx` Account type row now shows marketplace commission under the plan name (subscription `commission_rate_bps` when present, else catalog by `plan_code`). `mapSubscriptionStatusSummary` includes `commission_rate_bps` / `commission_lock_months`.

