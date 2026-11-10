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

- Instant Rollback on Hobby goes back one production deployment only. Older deployments can be re-released only if they were never live before (a deployment that has been promoted cannot be promoted again); otherwise push a revert and release that.
- Retention: production 14 days, preview 7 days, canceled/errored 1 day; the 10 newest production deployments and any deployment with a production alias are always kept.
