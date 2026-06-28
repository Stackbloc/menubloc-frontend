# Production Watchdog

`.github/workflows/production-watchdog.yml` runs on GitHub-hosted infrastructure every five minutes. It does not call Menuply PHMS and remains available when the application, Railway, or the Menuply database is down.

It probes `/`, `/search`, `/browse`, `/owner`, and `/api/health` and records timestamp, status, response headers, excerpt, deployment ID, `x-vercel-id`, and pass/fail. It rejects non-200 responses, timeouts, blank content, Vercel/function crash markers, missing Vite assets, and JSON on frontend routes.

On failure it:

1. Appends `docs/incidents/YYYY-MM-DD_production-health.jsonl` in the workflow workspace.
2. Writes a full incident JSON file.
3. Uploads `docs/incidents/` as a 90-day GitHub artifact.
4. Sends SMTP email when `SMTP_URL`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `ALERT_EMAIL_FROM`, and `ALERT_EMAIL_TO` secrets exist.
5. Opens or updates a `production-outage` issue when repository variable `WATCHDOG_OPEN_ISSUE=true`.
6. Fails the workflow.

Manual production verification:

```sh
WATCHDOG_BASE_URL=https://menuply.com npm run watchdog:production
```

Simulated failure verification uses workflow dispatch with a test server URL or locally:

```sh
WATCHDOG_BASE_URL=http://127.0.0.1:5050 npm run watchdog:production
```

The automated tests provide deterministic 500 and `FUNCTION_INVOCATION_FAILED` responses and verify incident artifact creation.
