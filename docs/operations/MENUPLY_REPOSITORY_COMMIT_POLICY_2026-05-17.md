# Menuply Repository Commit Policy

- Path: `menubloc-frontend/docs/operations/MENUPLY_REPOSITORY_COMMIT_POLICY_2026-05-17.md`
- Filename: `MENUPLY_REPOSITORY_COMMIT_POLICY_2026-05-17.md`
- Date: `2026-05-17`
- Purpose: Practical commit and push policy for the Menuply workspace and deployable repos.

## Deployable Repos

- `menubloc-frontend`
- `menubloc-backend`

## Parent Repo Policy

- The parent `/Desktop/menubloc` repo is local workspace only for now.
- Do not push the parent repo unless a valid remote is explicitly provided.

## Commit Rules

- Commit only files related to the requested task.
- Avoid unrelated dirty files.
- Do not mass-add the entire repo blindly.
- Run a build before commit when applicable.

## Push Rules

- Frontend changes go to `menubloc-frontend` only.
- Backend changes go to `menubloc-backend` only.

## Guardrails

- Verify the git remote before push.
- Verify the current branch before push.
