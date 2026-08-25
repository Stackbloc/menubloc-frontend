# End-to-End Verification Completion Contract

**Established:** 2026-08-25  
**Incident:** Eating video Post was certified “wired end-to-end” from code review and unit/contract tests while production Supabase bucket `menu-item-photos` rejected `video/mp4` (`mime type video/mp4 is not supported`). Upload returned 503; no durable `video_url` could be saved. Prior audit marked hops PASS on code alone.  
**Type:** Hard process guardrail — completion / “done” claims  
**Priority:** Overrides “code looks correct,” unit tests alone, and speculative Fixed/Working/Complete language  
**Related:** CLAUDE.md NO-GUESS + End-to-End Verification; Production Working Features Only; Ingestion Fix Verification; Franchise Search Completion Gate

---

## Hard rule

**No agent may submit work as complete, fixed, working, verified, or ready to ship unless the user-visible (or API-visible) path was exercised end-to-end in the real target environment — including database writes/reads when the feature persists data — and the results are certified.**

Code review, static contract tests, dry-run output, “should work,” and “wired in code” are **not** completion.

Silence, prior audits for a different hop list, or a different environment ≠ current-task certification.

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

---

## Agent stop lines

If asked to mark done without E2E:

> Per the End-to-End Verification Completion Contract, I have not marked this complete. Required hops are still [list]. Code/unit evidence alone is insufficient.

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

> ☐ E2E VERIFICATION CERTIFICATION: Claim [complete | not complete]; hops run [list or n/a]; DB/media proof [yes: … | n/a | blocked: …]; prior doc reuse [none | path]; environment [local | production | …].

If the task was docs-only / guardrail-only / no runtime claim: `Claim [n/a — no runtime completion claim]; hops run [n/a]`.

---

## Motivating counterexample (do not repeat)

**2026-08-25 eating video:** FE Post → `uploadWhatIAteTodayPhoto` → `video_url` → `createWhatIAteToday` looked complete in code. Live `buildPhotoRecordFromUpload` failed: durable upload to `menu-item-photos` rejected `video/mp4`. Until upload+insert+HEAD pass in production, “videos can post and be saved” is **NOT COMPLETE**.
