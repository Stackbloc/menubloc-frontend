# Runtime Contract Test Requirement

**Established:** 2026-09-02  
**Incident:** Owner Video Catalog date-range filter shipped with static `read()` + `assert.match` contract tests only — no runtime proof that invalid dates return **400** instead of **500**.  
**Type:** Hard process guardrail — contract tests and completion claims  
**Priority:** Complements [Server Runtime Check Completion Contract](./2026-08-29_server-runtime-check-completion-contract.md) and [End-to-End Verification Completion Contract](./2026-08-25_end-to-end-verification-completion-contract.md)

---

## Hard rule

**Contract tests for API routes and validation logic must execute runtime behavior — not only static file reads.**

For every new or changed backend route, service validation, or query param contract:

1. **Runtime unit tests** — call the pure function or parser; assert thrown `statusCode` / return values (e.g. `400` + `code`, not uncaught exceptions).
2. **Runtime route tests** — invoke the Express router with stubbed `db` (see `test/ownerRouteContract.test.js`, `test/ownerVideoCurationRoute.test.js`); assert HTTP status and body shape.
3. **Production smoke probe** — add a row to `backendProductionSmokeProbes.js` when the route ships; probed path must not return **5xx** when unauthenticated or with known-bad input.

Static wiring tests (`assert.match(read(file), /pattern/)`) are **supplementary** — they do not satisfy this contract alone.

---

## Required status behavior

| Input / auth | Expected | Forbidden |
|--------------|----------|-----------|
| No session | `401` or `403` | `500` |
| Invalid params (bad date, inverted range, missing required field) | `400` + `ok: false` + `code` when applicable | `500` |
| Valid auth + valid params | `200` + expected shape | `500` |

Agents must **assert the status code**, not infer it from source patterns.

---

## Never claim route work complete based only on

- Static contract tests that only `read()` files and regex-match strings
- “Route is mounted in `server.js`”
- `/health` commit match without smoke + runtime route tests
- FE wiring without BE runtime tests when the API contract changed

---

## Required files when adding/changing routes

| Layer | File pattern | Example |
|-------|--------------|---------|
| Pure validation | `test/<feature>*.test.js` calling exported helpers | `platformVideoCurationDateFilter.test.js` |
| Route HTTP | `test/<feature>Route.test.js` with `callRouter` + stubbed `db` | `ownerVideoCurationRoute.test.js` |
| Production smoke | `src/deploymentOps/backendProductionSmokeProbes.js` | `owner_videos_list_date_range` |
| Smoke anchor | `test/backendProductionSmokeContract.test.js` probe count | update when probes added |

---

## Agent stop line

> Per the Runtime Contract Test Requirement, I have not marked this route work complete. Runtime tests asserting 401/400/200 (not 500) are [missing | not run]. Static file-read contracts alone are insufficient.

---

## Mandatory certification (when backend routes/validation changed)

End every response with:

> ☐ RUNTIME CONTRACT TEST CERTIFICATION: Runtime unit tests [pass | fail | not run — reason]; runtime route tests [pass | fail | not run — reason]; smoke probe [added+PASS | added+not run | n/a]; static-only contracts [supplementary | insufficient alone].

When backend routes were edited, runtime route tests **must pass** before `Complete` / `CPD done`.

---

## Related

- [Server Runtime Check Completion Contract](./2026-08-29_server-runtime-check-completion-contract.md) — production smoke `RESULT=PASS`
- [End-to-End Verification Completion Contract](./2026-08-25_end-to-end-verification-completion-contract.md) — authenticated E2E hops
