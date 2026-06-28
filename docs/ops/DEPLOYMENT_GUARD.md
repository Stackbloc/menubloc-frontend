# Deployment Guard

Menuply has two production applications and they are not interchangeable:

| Application | Repository | Platform | Project | Production identity |
|---|---|---|---|---|
| Frontend | `Stackbloc/menubloc-frontend` | Vercel | `menubloc-frontend` / `prj_xvvxrY8NnlHMSTrQCMM4I4fNoUxu` | `menuply.com`, `www.menuply.com`, Vite output |
| Backend | `Stackbloc/menubloc-backend` | Railway | `Menuply` / `menubloc-backend` | `menubloc-backend-production.up.railway.app`, `src/server.js` |

The backend contains both a failing `vercel-build` command and a failing Vercel `buildCommand`. The umbrella workspace Vercel config also fails closed. Backend code cannot produce a Vercel deployment.

## Typed commands

Run frontend commands from the frontend repository root:

```sh
npm run deploy:frontend:preview
npm run deploy:frontend:production
```

Run backend commands from the backend repository root:

```sh
npm run deploy:backend:staging
npm run deploy:backend:production
```

Production commands require the exact repository, origin, `main` branch, clean tree, platform project/service, environment, artifact, domains, and required variables. Dirty deployment is only available when both `--allow-dirty` and `ALLOW_DIRTY_DEPLOY=1` are deliberately supplied.

## Blue/green frontend release

`deploy:frontend:production`:

1. Inspects `menuply.com` and records BLUE URL/ID.
2. Builds production Vite output and rejects backend/serverless artifacts.
3. Deploys GREEN without a production alias.
4. Verifies GREEN belongs to the frontend project and smokes all routes.
5. Moves both production aliases to GREEN.
6. Smokes both public aliases.
7. Restores both aliases to BLUE on any failure.
8. Writes `docs/deployments/*_frontend-blue-green.json`.

The production build is uploaded with `vercel deploy --prebuilt --prod --skip-domain`: it receives production environment configuration but cannot move a domain. Promotion remains an explicit alias transaction after GREEN passes.

## Release type classification

The full-stack guard accepts exactly: `frontend-only`, `backend-only`, `database-only`, `full-stack`, and `config/env/domain-only`.

From the backend repository:

```sh
npm run release:guard -- --type backend-only --phase preflight --environment production
npm run release:guard -- --type full-stack --phase smoke --environment production
npm run release:guard -- --type config/env/domain-only --phase preflight --environment production
```

Database releases additionally require `DATABASE_URL` and `MIGRATION_MANIFEST`. Example manifest:

```json
{
  "migration": "sql/migrations/example.sql",
  "reversible": true,
  "rollback": "sql/migrations/example.rollback.sql"
}
```

An irreversible migration must use `"reversible": false` and a non-empty `irreversible_reason`. The guard validates connectivity, required relations, critical row counts, and representative menu/search queries. It does not execute database writes.

Every full-stack guard run appends a release record. Every failure also appends `docs/incidents/YYYY-MM-DD_production-health.jsonl` and freezes the deployment.

## Verification tests

```sh
cd <frontend-repository-root>
npm run test:deployment-guard

cd <backend-repository-root>
npm run test:deployment-guard
```
