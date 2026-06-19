# Recovery Anchor Proof — 2026-06-18 Live Good State

## Commands Executed

git branch safety/live-good-menuply-2026-06-18 ec19ec9
git tag live-good-menuply-2026-06-18 ec19ec9 -m "Lock: live working menuply.com state as of 2026-06-18. Deployment dpl_HHfjsJLsf2qGKubThAN7w3dSq3A7 READY."
git push origin safety/live-good-menuply-2026-06-18
git push origin live-good-menuply-2026-06-18

## Push Output

Branch:
  remote: Create a pull request for 'safety/live-good-menuply-2026-06-18' on GitHub by visiting:
  remote:      https://github.com/Stackbloc/menubloc-frontend/pull/new/safety/live-good-menuply-2026-06-18
  To https://github.com/Stackbloc/menubloc-frontend.git
   * [new branch]      safety/live-good-menuply-2026-06-18 -> safety/live-good-menuply-2026-06-18

Tag:
  To https://github.com/Stackbloc/menubloc-frontend.git
   * [new tag]         live-good-menuply-2026-06-18 -> live-good-menuply-2026-06-18

## Verification — git ls-remote output

git ls-remote --heads origin safety/live-good-menuply-2026-06-18
ec19ec9f431ebaff54b407116a03fd805894eee1	refs/heads/safety/live-good-menuply-2026-06-18

git ls-remote --tags origin live-good-menuply-2026-06-18
ebf03e5820218f3a5edfc2dfee6d29338821792e	refs/tags/live-good-menuply-2026-06-18

## Recovery Anchors

branch:  safety/live-good-menuply-2026-06-18  →  ec19ec9
tag:     live-good-menuply-2026-06-18         →  ec19ec9 (annotated, resolves to ebf03e5)

## How to Restore

To restore this exact state:

  git checkout safety/live-good-menuply-2026-06-18

To deploy from this state:

  git checkout safety/live-good-menuply-2026-06-18
  vercel --prod

To restore from tag:

  git checkout live-good-menuply-2026-06-18
  vercel --prod
