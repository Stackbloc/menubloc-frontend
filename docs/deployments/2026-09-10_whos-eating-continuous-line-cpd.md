# CPD — Who's Eating continuous line (affiliation)

| | |
|--|--|
| **Date** | 2026-09-10 |
| **FE** | `menubloc-frontend-main` @ `1a859ee1` |
| **Tip** | `menubloc-frontend-jw88fcqdp-menuply.vercel.app` / `index-BFoIhLt5.js` |
| **BE** | `menubloc-backend-main` @ `f37add40` |
| **Health** | `f37add408b3f7bcd181cf5347ecaf59861f13ea8` |
| **Smoke** | `cpd-be.sh` `RESULT=PASS` (14 probes) |

## Product

Who's Eating on owner `/feed/profile` is one continuous line:

`[avatar] ScreenName, Sex, Age, Affiliation is eating [food] at [restaurant|@home]`

- Affiliation: college first, else occupation (one only)
- Clickable: screen name → peer profile; dish; restaurant
- Excludes viewer; liberal market discovery (no favorite-food narrow)

## Verification

- FE contracts: nearbyEatingPhase3 + dinerActivityScanRow PASS
- Live guest `see-whos-eating` returns AndreB / Yoshinoya
- Formatter E2E: `AndreB, M, 34, USC is eating Yoshinoya at Yoshinoya.` (college wins over occupation)
- Tip-gate apex + www: `RESULT=PASS`
- BE smoke: `RESULT=PASS` matching `health_commit`

## CPD doors

- `cpd-be.sh --no-push` → `RESULT=PASS`
- `cpd-fe.sh` → `RESULT=PASS`
