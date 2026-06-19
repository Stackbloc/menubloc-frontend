# 2026-06-18 Live Good State — Recovery Record

## Status

LOCKED. This is the accepted baseline for all future Menuply improvements.

---

## Deployment Information

deployment_id:      dpl_HHfjsJLsf2qGKubThAN7w3dSq3A7
deployment_url:     menubloc-ab4m16gfk-menuply.vercel.app
production_domain:  menuply.com
readyState:         READY
created:            2026-06-18T09:14:30.306Z
framework:          vite
install_command:    npm ci
node_version:       24.x

Aliases:
  menubloc.vercel.app
  menubloc-menuply.vercel.app
  menubloc-helloandrebarber-3935-menuply.vercel.app

---

## Repository Information

repository:  /Users/andrebarber/Desktop/menubloc/menubloc-frontend
branch:      main
sha:         ec19ec9f431ebaff54b407116a03fd805894eee1
commit:      fix: force Vite framework in vercel.json to override dashboard services setting

---

## Recovery Branch

safety/live-good-menuply-2026-06-18

Verified on origin:
  ec19ec9f431ebaff54b407116a03fd805894eee1  refs/heads/safety/live-good-menuply-2026-06-18

---

## Recovery Tag

live-good-menuply-2026-06-18

Verified on origin:
  ebf03e5820218f3a5edfc2dfee6d29338821792e  refs/tags/live-good-menuply-2026-06-18

---

## Accepted Baseline Characteristics

- Bottom navigation present
- Home tab present
- Waiter tab present
- Following tab present (displays as "F" — intentional, not a defect)
- Basket tab present
- Search functioning
- Search results rendering
- Restaurant signup functioning
- Waiter route functioning (/waiter)
- Search improvements from post-June-9 work preserved

---

## Screenshot Index

docs/recovery/2026-06-18-live-good-state/screenshots/

Status: Pending manual browser capture.
See screenshots/README.md for required captures and verification criteria.

---

## Evidence Files

docs/recovery/2026-06-18-live-good-state/deployment-evidence.md
docs/recovery/2026-06-18-live-good-state/repository-inventory.md
docs/recovery/2026-06-18-live-good-state/recovery-anchor-proof.md
docs/recovery/2026-06-18-live-good-state/app-shell-audit.md
docs/recovery/2026-06-18-live-good-state/build-identity-plan.md
docs/recovery/2026-06-18-live-good-state/screenshots/README.md

---

## Known Issues (future work only — do not fix in this session)

- Search result cards need future visual improvement
- Signup flow needs future visual improvement
- Logo sizing/placement may need future refinement
- Waiter UI may need future polish

---

## How to Restore This State

git checkout safety/live-good-menuply-2026-06-18
vercel --prod

Or from tag:

git checkout live-good-menuply-2026-06-18
vercel --prod

---

## Hard Stop

No UI changes, CSS changes, layout changes, navigation changes, commit restores,
cherry-picks, deployments, or merges until this record is confirmed complete.
