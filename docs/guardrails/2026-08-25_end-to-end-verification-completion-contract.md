# End-to-End Verification Completion Contract

**Established:** 2026-08-25  
**Updated:** 2026-09-05 — ban FE-only / tip-gate / “not run — reason” completion waivers (DOB/favorites “Server error” after FE CPD)  
**Incident:** Eating video Post was certified “wired end-to-end” from code review and unit/contract tests while production Supabase bucket `menu-item-photos` rejected `video/mp4` (`mime type video/mp4 is not supported`). Upload returned 503; no durable `video_url` could be saved. Prior audit marked hops PASS on code alone.  
**Incident (2026-09-05):** Connect-peer FE CPD shipped DOB + favorites Save; tip-gate PASS; certifications used `not run — FE-only`; live Save showed **Server error**. BE was not re-proven; authenticated PUT never run.  
**Type:** Hard process guardrail — completion / “done” claims  
**Priority:** Overrides “code looks correct,” unit tests alone, and speculative Fixed/Working/Complete language  
**Related:** CLAUDE.md NO-GUESS + End-to-End Verification; [Server runtime](./2026-08-29_server-runtime-check-completion-contract.md); [Health proof that counts](./2026-09-03_backend-health-proof-counts-contract.md); Production Working Features Only; CPD playbook

---

## Hard rule

**No agent may submit work as complete, fixed, working, verified, or ready to ship unless the user-visible (or API-visible) path was exercised end-to-end in the real target environment — including database writes/reads when the feature persists data — and the results are certified.**

Code review, static contract tests, dry-run output, “should work,” and “wired in code” are **not** completion.

Silence, prior audits for a different hop list, or a different environment ≠ current-task certification.

**FE tip / `cpd-fe.sh` PASS does not waive this.** If the ship adds or changes UI that calls an API or persists data, E2E hops are required even when zero backend files changed this turn.

---

## Banned completion excuses (invalid — do not use)

Agents invent a new excuse every ship. These are **always invalid** for Complete / CPD done / Fixed / Verified when the path touches an API, DB, media, or auth mutation:

| Excuse | Why invalid |
|--------|-------------|
| “FE-only” / “Scope: FE only” / “not run — FE-only” | UI that saves or loads server state is a **runtime path**, not a static page |
| Tip-gate / `cpd-fe.sh` `RESULT=PASS` alone | Proves tip identity, not feature success |
| Unauthenticated `401` / “route exists” | Auth gate ≠ authenticated success |
| Generic smoke PASS without this mutation | Smoke list may not include the route; still need E2E for the ship |
| “BE unchanged this turn” | Existing BE can still 500 on new payload/columns |
| “User will verify on phone later” | Agent-runnable hops are agent’s job |
| Filling certification with `not run — <story>` while claiming Complete | Checkbox + waiver = **INVALID** completion |
| Unit / static contract PASS only | Already banned; restated |

If a hop cannot be run → mark **NOT COMPLETE** / `CPD=INCOMPLETE`. Do **not** invent a reason that converts “not run” into “done.”

---

## Applies to

Every task that claims any of:

- Fixed / Resolved / Working / Verified / Complete / Ready / Shipped / CPD done
- A user-facing flow (UI → API → storage → DB → display)
- A backend mutation, migration, upload, search result change, or owner report number
- Production or production-like behavior (Railway, menuply.com tip, live DB)

**Database-related work is always in scope** when the feature reads or writes rows, media URLs, or derived counts: prove the row (or durable object) exists with the expected fields after the action, and that consumers of that data see it.

---

## Exception — prior certification already documented

Skip re-running hops **only when all** of the following hold:

1. A dated audit or handoff in `docs/audits/` or `docs/handoffs/` already records **PASS** for the **same** hop list  
2. Same target environment (e.g. production Railway + same tip/BE SHA when those matter)  
3. This task did **not** change code, env, schema, buckets, or config on that path  
4. The agent **cites** the file path and date in the E2E CERTIFICATION line  

If anything on the path changed, or the prior doc only proved code/unit tests, **re-run**.

---

## Required hop pattern (adapt per feature)

Before claiming complete, list the hops for **this** feature, then execute each with real evidence:

| # | Hop | Evidence examples |
|---|-----|-------------------|
| 1 | Trigger | UI action, API call, or script that starts the path |
| 2 | Service accepts | HTTP status + body fields (not only “route exists”) |
| 3 | Persist | DB row / column values, or durable storage object (HEAD/GET URL) |
| 4 | Read-back | List/detail/search/report returns the new state |
| 5 | Consumer surface | UI or downstream consumer shows it (or API contract used by FE) |

Minimum for **DB-backed** features: after the write, query or API-read the row and report actual field values (e.g. `video_url` non-null HTTPS, `status=active`).  
Minimum for **media**: durable public URL returns 2xx with expected content-type — not only “upload handler returns JSON in code.”

When a hop cannot be run (no auth, no phone, no DB access), state that explicitly and mark the task **NOT COMPLETE** for that hop — do not substitute code PASS.

---

## Never claim complete based only on

- Reading source / “path is wired”
- Unit or static contract tests without a live hop
- Historical rows that no longer exist (“photos worked last week”)
- Empty production tables + “user must prove on phone” as a substitute for agent-runnable hops (upload → insert → HEAD → soft-delete is agent-runnable)
- Tip/bundle string presence without exercising the failing subsystem (storage, MIME, env)
- Any row in **Banned completion excuses** above

---

## Agent stop lines

If asked to mark done without E2E:

> Per the End-to-End Verification Completion Contract, I have not marked this complete. Required hops are still [list]. Code/unit evidence alone is insufficient. FE-only / tip-gate PASS is not an exemption.

If a prior audit is reused:

> E2E hops reused from [docs/audits/…]; scope unchanged this turn; no path/env edits.

---

## Documentation

When E2E is newly run for a non-trivial feature, record hops + evidence in:

- `docs/audits/YYYY-MM-DD_<topic>.md` (preferred for production findings), and/or  
- the active `docs/handoffs/YYYY-MM-DD_<topic>_handoff.md`  

Index audits in `docs/audits/README.md` when creating a new audit file.

---

## Mandatory on EVERY task that submits work as complete

End the response with:

> ☐ E2E VERIFICATION CERTIFICATION: Claim [complete | not complete | n/a — docs/guardrail-only no runtime claim]; hops run [list — required if claim=complete and path touches API/DB/media]; DB/media proof [yes: … | n/a | blocked → claim must be not complete]; prior doc reuse [none | path]; environment [local | production | …].

**Certification rules (2026-09-05):**

- `Claim [complete]` requires hops run listed with evidence — not `n/a`, not `not run — FE-only`.
- `blocked: …` forces `Claim [not complete]` (or `CPD=INCOMPLETE`). Never pair blocked with Complete.
- Docs/guardrail-only: `Claim [n/a — docs/guardrail-only no runtime claim]` only when **no** feature/CPD runtime claim was made.

---

## Motivating counterexamples (do not repeat)

**2026-08-25 eating video:** FE Post → `uploadWhatIAteTodayPhoto` → `video_url` → `createWhatIAteToday` looked complete in code. Live `buildPhotoRecordFromUpload` failed: durable upload to `menu-item-photos` rejected `video/mp4`. Until upload+insert+HEAD pass in production, “videos can post and be saved” is **NOT COMPLETE**.

**2026-09-05 diner profile DOB/favorites:** FE CPD tip-gate PASS; certifications waived with FE-only; live Save → **Server error**. Tip identity ≠ mutation success.
