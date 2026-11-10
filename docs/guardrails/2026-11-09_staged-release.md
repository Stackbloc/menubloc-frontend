# Staged frontend release (2026-11-09)

One build per commit, one way to go live.

## How it works

| Step | Who | What |
|---|---|---|
| Build | Vercel GitHub integration | Every push to `main` builds a production deployment. "Auto-assign Custom Production Domains" is **off**, so the build is staged: it gets its own `*.vercel.app` URL and no production domains. |
| Skip | `scripts/release/vercel-ignore-build.sh` (vercel.json `ignoreCommand`) | On `main`, if every file changed since the last successful deployment is in `docs/`, `.github/`, top-level `*.md`, `scripts/release/` or `scripts/assert-menuply-production-tip.sh`, the build is skipped (CANCELED). Any other file, a missing previous SHA, or any git error → build. Branch previews always build. |
| Release | `scripts/release/release-fe.sh` (via `scripts/cpd-fe.sh` on the Mac, or the **Release frontend** GitHub Action) | Promotes the staged build of one exact commit. |

## Release script guarantees

1. **Exact commit.** The commit must be on `origin/main`. Its deployment is looked up by full SHA and must be a GitHub (`source=git`) production build of `Stackbloc/menubloc-frontend` `main` in state READY. If that commit's build was skipped (docs/lock-only), the script steps back only across docs/lock-only commits to the nearest commit with its own build, and checks the two differ only in docs/lock files. It never picks "the latest Ready deployment".
2. **Checked before it is live.** Deployment metadata; the tip-gate content checks run against the staged deployment (`TIP_GATE_DEPLOYMENT=<id>`, fetched with `vercel curl`, which handles deployment protection); `/demo`, `/sitemap.xml` (middleware), the USC cluster and `/search` return 200; Railway `/health` is 200. Any failure → refused, production untouched.
3. **Promote** with `vercel promote` (reuses the build; no rebuild).
4. **Checked live.** All four hosts (menuply.com, www, crm, venues) must point at the new deployment; the live HTML must show the bundle; wait 120 s (Cloudflare, see the cached-404 incident) before fetching it; live content checks; tip lock (`scripts/release/lock-tip.sh`); tip-gate must PASS on apex and www.
5. **Rollback.** Any failure after promotion runs `vercel rollback <previous deployment>`, verifies menuply.com serves it again, and re-locks the tip to it. Exit codes: 0 PASS, 1 refused (nothing changed), 2 rolled back, 4 rollback failed (act now; the command is printed).

## Commands

```bash
bash scripts/cpd-fe.sh "note"                       # Mac: release origin/main
bash scripts/cpd-fe.sh --dry-run "note"             # every check, no promotion
gh workflow run release-frontend.yml --ref main -f sha=<commit> -f note="note"
gh workflow run release-frontend.yml --ref main -f dry_run=true
vercel rollback <deployment id> --scope menuply     # manual rollback (Hobby: previous production deployment only)
```

The GitHub Action needs the `VERCEL_TOKEN` secret. Add required reviewers to the `production` environment if every release should need an approval.

## Limits (Vercel Hobby)

- Instant Rollback on Hobby goes back one production deployment only (the release script always rolls back to the deployment that was live just before it). To go further back, release an older commit on main by SHA (`--sha`), or push a revert and release that.
- Vercel's docs say a deployment that was live before cannot be promoted again; on this project it could (tested 2026-11-09: `dpl_8qMK…` was promoted, rolled back, then promoted and released).
- Vercel switches automatic domain assignment back on after a promote. The release script switches it off again right after and refuses to continue if it cannot, so there are only seconds after each promote in which a push could go live unchecked.
- Retention: production 14 days, preview 7 days, canceled/errored 1 day; the 10 newest production deployments and any deployment with a production alias are always kept.

## Test record (2026-11-09)

| Test | Result |
|---|---|
| `--skip-domain` staged build on Hobby, then `vercel promote` | all 5 hosts moved in 3 s |
| `vercel rollback` to the previous deployment on Hobby | all hosts back in 2 s, tip-gate PASS |
| Push to `main` with auto-assign off | built once, stayed staged (menuply.com unchanged) |
| Release `ba705407` via `cpd-fe.sh` | PASS (pre-checks, promote, live checks, lock, apex+www PASS) |
| Lock-only commit pushed | Vercel build CANCELED by the ignore step ("docs/release-lock only") |
| Release `b12feb7b` with an injected failure after promotion | automatic rollback, exit 2, hosts back, lock restored |
| Release `b12feb7b` again | PASS in 2 min 53 s |
| Refusals | unpushed commit, branch-only commit, unknown SHA all refused, production untouched |
| GitHub Action dry run without `VERCEL_TOKEN` | stops at the token check with a clear error |
