# CPD — Video Manager mute/run/inactive + drop Today kicker (2026-09-10)

## Scope
- **BE:** `video_asset_metadata` playback settings (`play_muted`, `run_starts_at`/`run_ends_at`, `manager_active`); Feed/profile/SEO honor visibility; Video Manager PATCH forwards settings; migration `0322`; mute backfill SusieCakes / All Burgers / Yoshinoya
- **FE:** Video Manager settings UI + Feed/profile **No sound.** forced mute; remove persistent **Today** kicker above What I'm Eating

## Ships
| Layer | Value |
|-------|-------|
| BE path | `menubloc-backend-main` @ clean `main` |
| BE feature | `492a998f` (settings + filters) |
| BE PATCH fix | `ce4307c3` |
| BE health | `ce4307c32b5d3a0fd812c5a0ea63ab6daa7f31e3` |
| Migration | `20260910_0322` applied production |
| FE path | `menubloc-frontend-main` @ clean `main` |
| FE tip commit | `cdf1fd5e` (includes `cb75cab4` Video Manager UI) |
| FE tip | `menubloc-frontend-1umjjglbw-menuply.vercel.app` / `index-BG8HyNh8.js` |

## E2E (production)
- Feed `play_muted=true` for `want:12` SusieCakes, `ate:24` All Burgers, `ate:23` Yoshinoya — **PASS**
- Inactive hide + reactivate + past `run_ends_at` hide (ate:23) — **PASS**
- Settings toggle unmute→Feed false→remute→Feed true (service `updatePlaybackSettings`) — **PASS**
- Live bundle contains `No sound.` (7) and `What I'm Eating` (8); `kicker:"Today"` count **0**

## Gates
```
# cpd-be.sh --no-push
RESULT=PASS
be_commit=ce4307c3
health_commit=ce4307c32b5d3a0fd812c5a0ea63ab6daa7f31e3
smoke RESULT=PASS passed=14

# cpd-fe.sh
RESULT=PASS
deploy=menubloc-frontend-1umjjglbw-menuply.vercel.app
bundle=index-BG8HyNh8.js
fe_commit=cdf1fd5e
tip-gate apex+www RESULT=PASS
```

## Note
Owner Video Manager HTTP PATCH authenticated UI click not exercised this turn; route forwards settings on live `ce4307c3` and service toggle E2E passed.
