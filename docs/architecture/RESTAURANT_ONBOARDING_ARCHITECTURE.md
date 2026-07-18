# Restaurant Onboarding Architecture

**Date:** 2026-07-18  
**Status:** Living architecture — early plan payment + post-locations upload/Worksheet/profile gate + deferred Finish setup (design last)  
**Related:**
- [`RESTAURANT_INFORMATION_ONBOARDING_SPEC.md`](./RESTAURANT_INFORMATION_ONBOARDING_SPEC.md)
- [`RESTAURANT_LOCATIONS_ONBOARDING_SPEC.md`](./RESTAURANT_LOCATIONS_ONBOARDING_SPEC.md)
- [`RESTAURANT_IDENTITY_ARCHITECTURE_SPECIFICATION.md`](./RESTAURANT_IDENTITY_ARCHITECTURE_SPECIFICATION.md)
- [`RESTAURANT_LAUNCH_READINESS_SPEC.md`](./RESTAURANT_LAUNCH_READINESS_SPEC.md)
- [`ONBOARDING_LOCATIONS_ARCHITECTURE.md`](./ONBOARDING_LOCATIONS_ARCHITECTURE.md)

---

## 1. Core principle — automatic checkpoints

Operators never decide whether to save.

- There is **no** mid-form “Save & Exit Later” or “Save Progress” control.
- After **profile publish**, the soft pause (“Continue: set up payments” vs “Continue later”) is allowed and **checkpointed** on `profile_complete_gate`.
- Each stage becomes a **checkpoint** only after:
  1. Client validation succeeds
  2. Server update succeeds
  3. Confirmation is returned
- Leaving the app mid-form does **not** checkpoint partial keystrokes.
- On return (refresh, new device, logout/login), Menuply resumes at the **first incomplete core** stage automatically. Deferred Finish-setup stages never force redirect away from the dashboard once the profile gate is done.

Informational copy such as “Your progress is saved automatically.” is allowed.

**localStorage is assist-only.** Authoritative state is server `restaurant_onboarding_progress` (+ `draft_payload.stage_records`).

---

## 2. Approved sequence (product)

### Core path (blocks dashboard until gate)

```text
welcome
→ plan_selected
→ account_created
→ email_verified
→ business_organization
→ payment                 # Menuply plan ONLY (Stripe); free → skip_reason=free_plan on org complete
→ qr_merchandise          # RESERVED — not Stripe-live; runtime skips to information
→ restaurant_information
→ locations               # never re-opens plan chooser; next = menu upload
→ menu_upload
→ menu_worksheet          # Menu Worksheet spreadsheet after parse
→ default_menu_ready      # after “Update Menuply Menu”
→ public_profile_edit     # My Account → Profile tab
→ profile_complete_gate   # celebration + Continue payments OR Continue later
→ complete                # dashboard eligible (core done)
```

### Deferred optional (Finish setup — do not force login redirect)

```text
merchant_onboarding   # /operator/merchant — recommended first after gate
delivery_onboarding   # /operator/delivery
menu_design           # /restaurant/design-select — LAST
```

**Continue later** on `profile_complete_gate` is recorded as `status: skipped`, `skip_reason: continue_later`. That is a checkpointed ack after profile publish — not mid-form Save & Exit. Login resume goes to dashboard; Finish setup cards offer one recommended deferred step at a time.

**QR merchandise constraint (2026-07-18):** unchanged — no Stripe QR kit charges until catalog exists.

See [`BUSINESS_ORGANIZATION_ARCHITECTURE.md`](./BUSINESS_ORGANIZATION_ARCHITECTURE.md) and [`MENUPLY_DOMAIN_MODEL.md`](./MENUPLY_DOMAIN_MODEL.md).

---

## 3. Field ownership (Restaurant Information vs Locations)

| Concern | Owner |
|---------|--------|
| Brand name, category, cuisine, manager, restaurant-wide phone/website | **Restaurant Information** |
| Street address, city/state/postal, country, lat/lng, timezone, location phone/hours | **Locations** → `public.restaurant_locations` |

Single-location restaurants still receive a distinct permanent **location UUID** under the restaurant. The restaurant row is never the location entity. See Locations + Identity specs.

---

## 4. Checkpoint persistence

| Layer | Store |
|-------|--------|
| Server SoT | `restaurant_onboarding_progress` (`current_step_key`, `completed_step_keys`, `selected_plan_code`, `draft_payload.stage_records`) |
| Stage record fields | `stage`, `completed_at`, `version`, `skip_reason`, `validation_status`, `status` |
| Auth payload | `/operator/auth/me` attaches progress keys per restaurant |
| Resume API | `GET …/onboarding/checkpoint` revalidates + returns `first_incomplete_stage` |
| Client assist | Session/local onboarding state for navigation continuity only |

Module: `menubloc-backend/src/services/restaurants/onboardingCheckpointService.js`  
Frontend resume: `menubloc-frontend/src/lib/operatorOnboardingCheckpoints.js`

### Free-plan payment bypass

Must be **recorded** as:

```json
{ "status": "skipped", "skip_reason": "free_plan", "version": "v1", "completed_at": "…" }
```

Created by `POST …/onboarding/organization/complete` when plan is free.  
**Locations complete never records payment skip and never routes to `/restaurant/subscription`.**  
Paid plans cannot skip payment; they auto-open Menuply plan Stripe Checkout after organization.

---

## 5. Revalidation

Completion is not permanent merely because a route was visited.

| Stage | Revalidation evidence |
|-------|----------------------|
| `restaurant_information` | name + category + phone still present |
| `locations` | ≥1 owned location with valid address |
| `payment` | active subscription **or** recorded free-plan skip |
| `public_profile_review` | explicit confirmation in `stage_records` |
| `published` / `complete` | published menu state |

Invalid underlying data reopens the stage (resume routes to recovery).

---

## 6. Resume on login

1. Resolve operator  
2. Resolve owned canonical restaurant  
3. Read persisted checkpoints  
4. Revalidate  
5. Route to first incomplete required stage  
6. Fully complete → dashboard  

Do **not** honor preferred dashboard routes that bypass incomplete onboarding.

---

## 7. Launch Checklist

Server evaluator — see [`RESTAURANT_LAUNCH_READINESS_SPEC.md`](./RESTAURANT_LAUNCH_READINESS_SPEC.md).  
PHMS IDs: `P2-ONB-01` … `P2-ONB-14`.

---

## 8. Public profile boundary

Consumer route `/restaurants/{slug}` remains the authoritative surface for **customer-facing presentation** when the owner is authenticated.

Must **not** edit: legal/billing, internal manager contact, internal email/phone, protected canonical identity.

Do not create a second independent public-profile editor.

---

## 9. Legacy `/restaurant-profile/:id`

- **Kept** — do not remove in this task  
- Confirm: not used by active onboarding/dashboard navigation (App still mounts route)  
- Page-level anonymous `POST/PATCH /restaurants` remains **legacy / forbidden for new work**  
- Shared UI extracted: `RestaurantInformationForm.jsx` (+ schema/helpers)  
- Future retirement checklist: remove route after operator settings consume shared form; delete anonymous write path; migrate any bookmarks; contract test asserting zero navigation refs

---

## 10. Prerequisites before Payment phase

1. Address ownership verified (Information rejects location fields; Locations complete requires address) — **done locally**  
2. Checkpoint resolution + free-plan explicit bypass — **done locally**  
3. Launch readiness evaluator inspectable — **done locally** (publish guard available; publish UI later)  
4. Public profile review confirmation write into `stage_records` — **remaining**  
5. Payment stage implementation — **not started** (do not begin until product signs off)  
6. Migrations for optional dedicated checkpoint table — **not required**; using `draft_payload.stage_records`

---

## 11. Stage route map (resume)

| Stage | Route |
|-------|-------|
| `restaurant_information` | `/restaurant/onboarding/information` |
| `locations` | `/restaurant/onboarding/locations` |
| `payment` | `/restaurant/subscription` |
| `public_profile_review` | `/restaurants/{slug}` (preferred) or design-select transitional |
| `menu_design` | `/restaurant/design-select` |
| `menu_upload` | `/restaurant/menu-upload-choice` |
| `menu_review` | `/operator/menulab` |
| `launch_checklist` | `/restaurant/onboarding/launch-checklist` (evaluator API live) |
| `complete` | `/operator` |
