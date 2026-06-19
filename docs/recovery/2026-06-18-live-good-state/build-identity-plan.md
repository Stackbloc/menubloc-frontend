# Build Identity Plan — 2026-06-18

## Problem

When a production issue is reported, it is currently impossible to answer:
  "What exact code is running on menuply.com right now?"

The Vercel CLI deploy path (vercel --prod) does not inject git SHA into the deployment metadata.
The --json output from vercel inspect returns no meta.githubCommitSha when deployed via CLI.
The only available evidence is: local git HEAD at the time of deploy + deployment ID.

---

## Proposed Implementation (NO CODE CHANGES — PLAN ONLY)

### Option A — Environment variable injection at build time

In package.json build script or vite.config.js, inject the git SHA as a build-time env var:

  VITE_GIT_SHA=$(git rev-parse HEAD) vite build

In vite.config.js:
  define: {
    __GIT_SHA__: JSON.stringify(process.env.VITE_GIT_SHA || 'unknown'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  }

Then expose in a route or console.log on app init:
  console.log('[menuply] build:', __GIT_SHA__, __BUILD_TIME__);

### Option B — Static build-info.json file

At build time, write a file to dist/:
  echo '{"sha":"'$(git rev-parse HEAD)'","ts":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}' > dist/build-info.json

This file is accessible at menuply.com/build-info.json without authentication.
Any agent or developer can curl it to identify the running build instantly.

### Option C — Vercel Git Integration (replace CLI deploy)

Connect the GitHub repo to Vercel via the GitHub integration instead of CLI.
Every push to main auto-deploys and populates meta.githubCommitSha in the deployment.
This provides full git metadata in vercel inspect --json output.

---

## Recommended Approach

Option B first (lowest risk, immediate value, no code change to app logic).
Option A second (developer console identity on every page load).
Option C long-term (proper CI/CD pipeline).

---

## Recovery Traceability Without This Plan

Until implemented, the recovery traceability chain is:

1. vercel ls --prod → get deployment URL (menubloc-ab4m16gfk)
2. vercel inspect <url> → get createdAt timestamp
3. Match timestamp to local git log (git log --format="%H %ai" | grep nearest time)
4. Confirm SHA matches recovery anchor

This is fragile. Option B eliminates the ambiguity with a single curl call.
