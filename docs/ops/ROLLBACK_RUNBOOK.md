# Rollback Runbook

## Outage response

1. Stop all deploys. Do not change database, environment, or domains while failure ownership is unknown.
2. Download the watchdog incident artifact and identify the failed domain: frontend, backend, database, or config/domain.
3. Keep the last known-good production target live. Apply only the matching rollback below.
4. Run the external watchdog against production after recovery.
5. Preserve the generated JSONL incident and deployment record.

## Frontend rollback

The guarded production command automatically restores both aliases when post-switch smoke fails. Manual restoration:

```sh
cd <frontend-repository-root>
npx vercel inspect menuply.com --format json
npx vercel alias set https://BLUE_DEPLOYMENT_URL menuply.com
npx vercel alias set https://BLUE_DEPLOYMENT_URL www.menuply.com
WATCHDOG_BASE_URL=https://menuply.com npm run watchdog:production
```

Use the BLUE URL/ID from `docs/deployments/*_frontend-blue-green.json`; do not guess from deployment recency.

## Backend rollback

The backend deploy guard captures the previous successful Railway deployment ID and freezes production if post-deploy smoke fails. Railway's Public API supports historical rollback when `canRollback` is true. The guided command is dry-run by default:

```sh
cd <backend-repository-root>
npm run rollback:backend -- PREVIOUS_SUCCESSFUL_DEPLOYMENT_ID
# Review can_rollback and required_confirmation, then:
ROLLBACK_CONFIRMATION='ROLLBACK PREVIOUS_SUCCESSFUL_DEPLOYMENT_ID' npm run rollback:backend -- PREVIOUS_SUCCESSFUL_DEPLOYMENT_ID --confirm
npm run release:guard -- --type backend-only --phase smoke --environment production
```

This requires `RAILWAY_API_TOKEN`. If the API reports `canRollback: false`, use Railway deployment history manually; do not redeploy the latest failed release. The system does not claim rollback succeeded until the API returns `deploymentRollback: true` and backend smoke passes.

Never attach `menuply.com` to Railway or the backend Vercel project.

## Database rollback

Stop the release before frontend/backend mutation. Read `MIGRATION_MANIFEST`; if reversible, have an authorized operator apply its exact rollback SQL and then rerun the database guard. Database mutation commands are intentionally not automated by this system. If marked irreversible, freeze deploys and use backup/forward-repair procedures documented in the manifest.

## Config, environment, or domain rollback

Restore the captured prior values on their owning platform, then run:

```sh
cd <backend-repository-root>
npm run release:guard -- --type config/env/domain-only --phase smoke --environment production
```

For an unknown failure, do not attempt multiple rollback domains at once. Freeze deployment and retain last known-good production.
