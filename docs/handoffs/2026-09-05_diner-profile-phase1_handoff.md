# Implementation — Phase 1 Diner Profile Expansion

| | |
|--|--|
| **Date** | 2026-09-05 |
| **Phase** | 1 of 8 (Diner Profile) |
| **Status** | Implemented in authorized trees (migration not yet applied to production) |
| **Principle** | [`2026-09-05_value-extraction-over-input-principle.md`](../architecture/2026-09-05_value-extraction-over-input-principle.md) |

---

## What shipped (Phase 1)

### Reused (not duplicated)

- `consumer_profiles` — extended columns
- Existing `diner_hobbies` (0307) — kept
- Existing discoverability system (0276/0287) — **extended** audiences; no parallel privacy stack
- Food taxonomy keys for favorites (not a free-form food system; icons presentation-only)

### New / changed

| Layer | Change |
|-------|--------|
| Migration | `menubloc-backend-main/sql/migrations/20260905_0314_diner_profile_identity_favorites.sql` — `diner_sex`, `date_of_birth`, `favorite_foods` JSONB, discoverability CHECK includes `anyone` / `connections` / reserved `edu` |
| Libs (BE) | `dinerProfileDiscoverability.js`, `dinerDateOfBirth.js`, `dinerFavoriteFoods.js`, `dinerSex.js`, `foodInterestIcons.js` |
| API | `GET/PUT /api/consumer/profile` — sex, DOB (+ derived age/birthday), favorite_foods, discoverability write = anyone\|area\|connections |
| Search | Find Diners enforces anyone / area (same city) / connections; legacy `nobody` + reserved `edu` stay hidden |
| FE | Account Profile tab — Sex & birthday, Favorite foods chips, discoverability UI without Nobody |
| Libs (FE) | Matching discoverability / favorites / icons / DOB helpers |

### Discoverability product map

| UI | Stored | Notes |
|----|--------|-------|
| Anyone | `anyone` | Legacy `members` canonicalizes to `anyone` |
| People in my area | `area` | Default for new profiles (unchanged) |
| My connections | `connections` | New |
| — | `nobody` | Legacy only; not in UI; still excluded from search |
| — | `edu` | Reserved for future .edu-verified audience (not student) |

### Value-extraction notes (Phase 1)

- Sex / DOB / hobbies / favorites are **optional** and light.
- Favorite foods copy frames unlock for discovery (not preference dumping).
- Full **automatic** “here’s nearby” return after Wanna Eat is **Phase 2** (documented in principle).
- DOB stored; age derived; peer surfaces get month/day foundation only when we wire birthday social later.

### Tests

- `node test/dinerProfilePhase1Contract.test.js` — PASS
- `node test/dinerPrimaryLocationContract.test.js` — PASS

### Not done this phase

- Production migration apply / BE CPD
- FE CPD
- Phase 2 Wanna Eat → auto nearby discovery return
- My Menuply hero display of favorites (optional follow-up; account tab is primary editor)

---

## Next agent

1. Apply migration 0314 on target DB before claiming API E2E.
2. Phase 2: after want save, auto-load nearby/connects/videos for that food signal (principle gate).
3. Keep category order; no Waiter edits until Phase 7 with Waiter named in turn.
