# Deployment Evidence — 2026-06-18 Live Good State

## Source

vercel inspect menubloc-ab4m16gfk-menuply.vercel.app --json
vercel ls --prod

## Raw Values

deployment_id:          dpl_HHfjsJLsf2qGKubThAN7w3dSq3A7
deployment_url:         menubloc-ab4m16gfk-menuply.vercel.app
production_domain:      menuply.com
target:                 production
readyState:             READY
createdAt_epoch:        1781774070306
createdAt_iso:          2026-06-18T09:14:30.306Z
build_id:               bld_hg837y61k
build_region:           sfo1
framework:              vite
install_command:        npm ci
node_version:           24.x
output_directory:       (Vite default — dist/)
build_command:          (Vite default — vite build && node scripts/prerender.mjs)

## Aliases

menubloc.vercel.app
menubloc-menuply.vercel.app
menubloc-helloandrebarber-3935-menuply.vercel.app

## Git Metadata

meta.githubCommitSha:   NOT PRESENT in --json output (CLI deploy, not GitHub push deploy)
meta.githubCommitRef:   NOT PRESENT
meta.githubCommitMessage: NOT PRESENT

## Git SHA — Derived from local repo at deploy time

HEAD at deploy time:    ec19ec9f431ebaff54b407116a03fd805894eee1
branch:                 main
commit_message:         fix: force Vite framework in vercel.json to override dashboard services setting

## Vercel Project

project_name:           menubloc
team/context:           menuply
username:               helloandrebarber-3935

## Prior Failed Deployments (same session)

menubloc-1jfv4dzzh-menuply.vercel.app     ERROR   (commit 1242979 — pre-framework-fix)
menubloc-ih5g6cv5z-andre-barber-s-projects.vercel.app  ERROR
menubloc-ly4omma3p-andre-barber-s-projects.vercel.app  ERROR

## vercel.json framework field

"framework": "vite" added at commit ec19ec9 to override dashboard "services" setting.
This field was absent in prior commits and caused all three Error deployments.
