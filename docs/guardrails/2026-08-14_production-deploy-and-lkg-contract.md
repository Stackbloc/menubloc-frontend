# Production Deploy + Last Known Good (LKG) Contract

**Established:** 2026-08-14  
**Type:** Contract (required procedure) + LKG registry  
**Cursor rule:** `.cursor/rules/production-deploy-and-lkg-contract.mdc` (`alwaysApply`)  
**Related:**  
- [CPD agent playbook (start here)](./2026-08-20_cpd-agent-playbook.md)  
- [Frontend deploy path](./2026-07-24_frontend-production-deploy-path-contract.md)  
- [Backend deploy path](./2026-07-28_backend-production-deploy-path-contract.md)  
**Tip gate:** `scripts/assert-menuply-production-tip.sh`  
**BE path gate:** `scripts/assert-backend-deploy-path.sh`  
**Priority:** Production safety — overrides convenience

---

## Purpose

Give every new agent a single place to find:

1. **Where** to deploy from  
2. **What** is currently live (LAST KNOWN GOOD)  
3. **Which prior tips** are restore targets (and what rolling back would undo)  
4. **How** to update LKG after a successful CPD  

Do **not** deploy from memory or from quarantined checkouts.

---

## CURRENT LAST KNOWN GOOD (live production — 2026-09-02)

Update this section **only** after tip-gate `RESULT=PASS` on apex + www. Railway `/health` is recorded separately; it may lag `origin/main`.  
**Tip lock procedure:** [2026-08-24_production-tip-lock-atomic-contract.md](./2026-08-24_production-tip-lock-atomic-contract.md)

### Frontend (menuply.com)

| Field | Value |
|-------|-------|
| Authorized path | `/Users/andrebarber/Desktop/menubloc/menubloc-frontend-main` @ clean `main` |
| Git commit | `4ccaf39f` — Feed default audio on; Video Manager modal metadata editor — Desktop Feed click-for-sound unmute — Feed video desktop framing, tap-for-sound, mic capture, place caption — Owner video catalog CK pickers + date filters (Easy Street BE seed already live) — Owner video catalog CK name search + created date range — Diner search + Make Me This profile display — owner video catalog CK pickers — diner hobbies collapsed personal details — collapse personal context editor behind toggle — inline personal context editor on profile — profile settings links discoverability — diner personal context profile header lines — owner Video Catalog console + asset numbers for all Feed videos — LGD Let's Get Drinks quick invite with optional menu attachment — Make Me This private I Wanna Eat requests — guest Post to Feed video Terms gate + signup invite — Billboard unauthorized asset removal — tip lock sync — Remove unauthorized scraped billboard assets — Billboard durable assets Tom's Emmy + systemic repair — Merge Home into Dishes on profile + Month in Food — Fixins billboard asset + tip sync — Indio Festival Grounds directory card name fix — Indio H1 SEO overlay pre-migration 0303 — Indio Festival Grounds tradename de-risk; BE 69b70d3b — Indio Festival Grounds tradename de-risk Option C — Indio Festival Grounds tradename de-risk Option C — Stats bar 5-col one line; Month in Food Home; Include DIY recipes search — billboard Tom's crop splash dedupe optional promo headline — operator billboard preview URL resolution — Menu Manager OCR source rail restore — My Menuply Home tab; remove profile homemade share CTA — Homemade Dishes: compose, detail, search Include Homemade, Show Me How — dining-crew reader vs member detail page split — My Menuply hybrid section polish + join-only profile cards — crew invite Connections picker + Find Diners UX — billboard FK media URLs + Klaudette mobile crop — sample menu stack + QR-first Share My Menuply — restaurant profile refinement + My Menuply /feed/profile hub — restaurant dining intent CPD finish — restaurant People who want to go dining intent — feed shareable videos+profiles; account invite on receive; quick invites — billboard 10 MB upload limit copy — owner Profile Manager billboard Windows photo upload — Feed X Upload media category picker E2E — Feed menu upload camera rail tooltip mobile icon — desktop Feed Log in Menuply green — Feed footer trim, My Menu Stack, X coach, desktop Home order — Feed Reviews + Food Review X + Share My Menuply rail + Shop footer polish — Feed desktop blank hotfix + full HomeNext Shop tab restore — Feed Shop HomeNext + shell basket alignment — Feed Shop tab, deals desktop fix, More menu, green login — Feed discovery rail, More menu, signup screen name — Feed default home at /; existing FeedPrimaryNav unchanged — Connect presumed name: First L. coalesce + signup names — Connect display names: First L. instead of Member # — Feed Search hero vertical spacing — Feed Share My Menuply → Diner QR page — Feed Search no menu windows + in-shell results — Feed Profile: profile-only, no hero/TV — Feed TikTok nav + slim X sheet — Feed Menus replaces Eating + mobile-first empty coach — Feed first-visit empty coach + counsel Terms/Privacy tip lock — Counsel-approved Terms+Privacy UGC Aug 27 2026 — Owner Feed Invite QR image credentialed fetch fix — Feed deal video swipe: meal-time filters + Lunch Deal caption + restaurant feed compose — Feed deal video swipe reel; text search on /deals — Feed X categorized menu: My Menuply, Share, Account — Owner Feed Invite QR editable poster copy — Feed Deals Live meal periods + media — feed eating tab real compose actions — eating restaurant + menu item fields for ate/want — feed deals chrome + me clusters/menu upload — feed video-only hybrid ConsumerCameraSheet recorder — feed center X video create + plan video attach — video-first parallel `/feed` shell (FEED\|EATING\|EVENTS\|ME); HomeNext remains `/` |
| Vercel deployment | `menubloc-frontend-my0q0ctnb-menuply.vercel.app` |
| Live bundle | `index-DTal_hZv.js` |
| Aliases | `menuply.com`, `www.menuply.com`, `crm.menuply.com`, `venues.menuply.com` |
| Tip-gate | **PASS** (apex + www) verified 2026-08-26 |
| Feature | Parallel video-first Feed at `/feed`; drawer “Feed (preview)”; `VITE_FEED_AS_HOME` cutover off |

### Backend (Railway)

| Field | Value |
|-------|-------|
| Authorized path | `/Users/andrebarber/Desktop/menubloc/menubloc-backend-main` @ clean `main` |
| Git on origin | `eab0c83f` |
| Live health SHA | `eab0c83f` |
| Health URL | `https://menubloc-backend-production.up.railway.app/health` |
| `commit_hash` | `eab0c83f…` |
| DB | migrations through `0300` (diner_restaurant_dining_intent) |
| Smoke | tip-gate PASS `6uj8rufl4` / `index-COekEjGi.js`; guest `/api/consumer/see-whos-eating` ok; railway=59 localhost=9 |

### Restore current tip (if tip-gate fails mid-change)

```bash
cd /Users/andrebarber/Desktop/menubloc/menubloc-frontend-main
npx vercel alias set menubloc-frontend-my0q0ctnb-menuply.vercel.app menuply.com
npx vercel alias set menubloc-frontend-my0q0ctnb-menuply.vercel.app www.menuply.com
npx vercel alias set menubloc-frontend-my0q0ctnb-menuply.vercel.app crm.menuply.com
npx vercel alias set menubloc-frontend-my0q0ctnb-menuply.vercel.app venues.menuply.com
bash ../../scripts/assert-menuply-production-tip.sh https://menuply.com
bash ../../scripts/assert-menuply-production-tip.sh https://www.menuply.com
```

### Prior tip — Restaurant/Dish live feed content labels (rollback target)

| Field | Value |
|-------|-------|
| Deployment | `menubloc-frontend-7hj7ojqsj-menuply.vercel.app` |
| Live bundle | `index-CR_WZrE5.js` |
| FE commit | `4810f03` / tip-lock docs `89a336e` |
| BE health | `14a98b5c` |
| Notes | Pre–video-first `/feed` shell; also tagged `menuply-pre-video-first-consumer-2026-08-26` |

### Prior tip — eating-plan video parity (rollback target)

| Field | Value |
|-------|-------|
| Deployment | `menubloc-frontend-81g8chsz7-menuply.vercel.app` |
| Live bundle | `index-Da0GLFZ7.js` |
| FE commit | `5e61477` |
| BE health | `a93a1fdc` |
| Notes | Pre–Live Feed category-below-@name layout |

### Prior tip — sticky title+feed / TikTok / posters (rollback target)

| Field | Value |
|-------|-------|
| Deployment | `menubloc-frontend-1r469iprr-menuply.vercel.app` |
| Live bundle | `index-CaMT7O9s.js` |
| FE commit | `1502c00` |
| BE health | `bbba2655` |
| Notes | Pre–centered title in green band |

### Prior tip — playback UI + live-feed pause (rollback target)

| Field | Value |
|-------|-------|
| Deployment | `menubloc-frontend-g0i59i1u8-menuply.vercel.app` |
| Live bundle | `index-Ckdz5Gru.js` |
| FE commit | `1f850ff` |
| BE health | `bbba2655` |
| Notes | Clean play URLs; pause sticky feed on meal play; pre–sticky title / TikTok reel |

### Prior tip — Video-first camera + diner-media (rollback target)

| Field | Value |
|-------|-------|
| Deployment | `menubloc-frontend-p15q2zbam-menuply.vercel.app` |
| Live bundle | `index-BvGoNScn.js` |
| FE commit | `a53280c` |
| BE health | `d3449e93` / later `bbba2655` |
| Notes | Video\|Photo default; label→capture; pre–playback UI / live-feed pause |

### Prior tip — See Who’s Eating sticky HUD (rollback target)

| Field | Value |
|-------|-------|
| Deployment | `menubloc-frontend-80fy979wl-menuply.vercel.app` |
| Live bundle | `index-BfPQn7JE.js` |
| FE commit | `b6d894d` |
| BE health | `bacd8051` |
| Notes | Sticky HUD; Photo-first camera; pre–Video-first / diner-media fix |

### Prior tip — camera idle verbiage removed (rollback target)

| Field | Value |
|-------|-------|
| Deployment | `menubloc-frontend-3mxbigczz-menuply.vercel.app` |
| Live bundle | `index-DgFyE8U0.js` |
| FE commit | `d8969f7` |
| BE health | `b0781d7a` |
| Notes | Blank video idle panel; pre–See Who’s Eating tip |

### Prior tip — Record video copy restore (rollback target)

| Field | Value |
|-------|-------|
| Deployment | `menubloc-frontend-2cgb8v0pn-menuply.vercel.app` |
| Live bundle | `index-DP4hQTxR.js` |
| FE commit | `01ddc2d` |
| BE health | `b0781d7a` |
| Notes | Idle panel still showed Record video (up to 10 minutes) |

### Prior tip — X sheet Eating order (rollback target)

| Field | Value |
|-------|-------|
| Deployment | `menubloc-frontend-pu6h2i0ob-menuply.vercel.app` |
| Live bundle | `index-DON2o8Iy.js` |
| FE commit | `ecde436` |
| BE health | `b0781d7a` |

### Prior tip — ShareModal mobile lift (rollback target)

| Field | Value |
|-------|-------|
| Deployment | `menubloc-frontend-2pxw8wkr2-menuply.vercel.app` |
| Live bundle | `index-BTEvldYm.js` |
| FE commit | `1ef546c` |
| BE health | `b0781d7a` |
| Notes | Upload media was incorrectly 2nd in Eating section |

### Prior tip — cluster hero ad branding hotfix (rollback target)

| Field | Value |
|-------|-------|
| Deployment | `menubloc-frontend-fntkuipor-menuply.vercel.app` |
| Live bundle | `index-BTEvldYm.js` |
| FE commit | `9b602dd` |
| BE health | `b0781d7a` |

### Prior tip — Android video soft-accept (rollback target)

| Field | Value |
|-------|-------|
| Deployment | `menubloc-frontend-azxhntx1m-menuply.vercel.app` |
| Live bundle | `index-DTFzIdfb.js` |
| FE commit | `5d6e26a` |
| BE health | `e36d2489` |

### Prior tip — Menuply Eating-is-Social ads-only (rollback target)

| Field | Value |
|-------|-------|
| Deployment | `menubloc-frontend-m67fxdy8z-menuply.vercel.app` |
| Live bundle | `index-ClE3rSAk.js` |
| FE commit | `56e0e7d` |
| BE health | `e36d2489` |

### Prior tip — owner diner capability wrap-up (rollback target)

| Field | Value |
|-------|-------|
| Deployment | `menubloc-frontend-bhsmmn3j5-menuply.vercel.app` |
| Live bundle | `index-COswfWJg.js` |
| FE commit | `f6f663e` |
| BE health | `dadb5bf9` |

### Prior tip — plan windows + events chrono (rollback target)

| Field | Value |
|-------|-------|
| Deployment | `menubloc-frontend-2q95zr9z7-menuply.vercel.app` |
| Live bundle | `index-Bc6lB1Ap.js` |
| FE commit | `e25acc5` |
| BE health | `c368ab73` |

### Prior tip — Invite Me Out (rollback target)

| Field | Value |
|-------|-------|
| Deployment | `menubloc-frontend-5qoxa42t4-menuply.vercel.app` |
| Bundle | `index-B45apyHC.js` |
| FE commit | `2ca855a` |
| BE health | `19e27bb3` |

### Prior tip — diner video record Stop blob URL fix (rollback target)

| Field | Value |
|-------|-------|
| Deployment | `menubloc-frontend-89jj1mz2b-menuply.vercel.app` |
| Bundle | `index-6lPa6XN2.js` |
| FE commit | `ef4420d` |
| BE health | `d15c9260` |

### Prior tip — eating video + compose menu item (rollback target)

| Field | Value |
|-------|-------|
| Deployment | `menubloc-frontend-5hahxk6st-menuply.vercel.app` |
| Bundle | `index-CYtSPDxP.js` |
| FE commit | `ec2dbca` |
| BE health | `d15c9260` |

### Prior tip — video upload Failed-to-fetch (rollback target)

| Field | Value |
|-------|-------|
| Deployment | `menubloc-frontend-626p0j6hy-menuply.vercel.app` |
| Bundle | `index-D_Nc-5PD.js` |
| FE commit | `bc104af` |
| BE health | `9174dbc9` |

### Prior tip — video upload Failed-to-fetch size/MIME (rollback target)

| Field | Value |
|-------|-------|
| Deployment | `menubloc-frontend-rh505od55-menuply.vercel.app` |
| Bundle | `index-B1mo46YC.js` |
| Commit | `29b1eef` / tip-lock `7a40166` |
| Notes | Pre–video upload Failed-to-fetch size/MIME CPD |

### Prior tip — grouped X / Search profiles / Join Me (rollback target)

| Field | Value |
|-------|-------|
| Deployment | `menubloc-frontend-cey0mwaa7-menuply.vercel.app` |
| Bundle | `index-BXhQToJa.js` |
| Commit | `dce082a` |
| Notes | Pre–eating camera flip / durable diner media CPD |

### Prior tip — meal photos + long-press Delete (rollback target)

| Field | Value |
|-------|-------|
| Deployment | `menubloc-frontend-fli5934kq-menuply.vercel.app` |
| Bundle | `index-D_zxLTdZ.js` |
| Commit | `b46d3ed` / `23b260e` |
| Notes | Pre–grouped X / Search profiles / Join Me CPD |

### Prior tip — billboard fallback (rollback target)

| Field | Value |
|-------|-------|
| Deployment | `menubloc-frontend-a304s1jgd-menuply.vercel.app` |
| Bundle | `index-CvkADiUB.js` |
| Commit | `9bd7574` |
| Notes | Pre–compact photos / menu-item prefer / long-press Delete CPD |

### Prior tip — My Menuply dish heroes + X gallery (rollback target)

| Field | Value |
|-------|-------|
| Deployment | `menubloc-frontend-7jj41b2cs-menuply.vercel.app` |
| Bundle | `index-Dy18r6lv.js` |
| Commit | `c21b76a` |
| Notes | Pre–billboard fallback CPD |

### Prior tip — important-action email Connect (rollback target)

| Field | Value |
|-------|-------|
| Deployment | `menubloc-frontend-b8kmlp3k2-menuply.vercel.app` |
| Bundle | `index-DcJ2rrvn.js` |
| Commit | `981db24` |
| Notes | Pre–My Menuply dish-hero / X profile gallery CPD |

### Prior tip — My Menuply five-section + X label polish (rollback target)

| Field | Value |
|-------|-------|
| Deployment | `menubloc-frontend-6sm7u9cwb-menuply.vercel.app` |
| Bundle | `index-GXbrWt3V.js` |
| Commit | `8bd0892` |
| Notes | Pre–important-action email CPD |

### Prior tip — My Menuply five-section first tip (rollback target)

| Field | Value |
|-------|-------|
| Deployment | `menubloc-frontend-g8uuar69o-menuply.vercel.app` |
| Bundle | `index-BpozLIHf.js` |
| Commit | `3056680` |
| Notes | Pre–X label polish (My Eating Plans / My Crews) CPD follow-up |

### Prior tip — YB empty + hub calendar/parity (rollback target)

| Field | Value |
|-------|-------|
| Deployment | `menubloc-frontend-9acktyci6-menuply.vercel.app` |
| Bundle | `index-lG7D8UuY.js` |
| Commit | `a37baf0` |
| Notes | Pre–My Menuply five-section / My Events CPD |

### Prior tip — Month in Food platform share (rollback target)

| Field | Value |
|-------|-------|
| Deployment | `menubloc-frontend-6nzh7hvv5-menuply.vercel.app` |
| Bundle | `index-RmW9q_Gr.js` |
| Commit | `cbc7728` |
| Notes | Pre–YB empty / hub calendar-parity CPD |

### Prior tip — My Menuply hub access (rollback target)

| Field | Value |
|-------|-------|
| Deployment | `menubloc-frontend-k2hpeyh3s-menuply.vercel.app` |
| Bundle | `index-DygwUgB7.js` |
| Commit | `5c82ea4` |
| Notes | Pre–Month in Food platform shareUtils CPD |

### Prior tip — connection food activity + YB scope (rollback target)

| Field | Value |
|-------|-------|
| Deployment | `menubloc-frontend-hzqhp15u6-menuply.vercel.app` |
| Bundle | `index-DZq-yI_T.js` |
| Commit | `d3eb1d2` |
| Notes | Pre–My Menuply hub access CPD |

### Prior tip — live getUserMedia camera (rollback target)

| Field | Value |
|-------|-------|
| Deployment | `menubloc-frontend-bm2jkijow-menuply.vercel.app` |
| Bundle | `index-BkJqmepa.js` |
| Commit | `7eaf78a` |
| Notes | Pre–connection-food / YB scope CPD |

### Prior tip — camera meal slots + time-aware rows (rollback target)

| Field | Value |
|-------|-------|
| Git commit | `7555de4` — desktop MediaRecorder restore; phones keep OS capture |
| Vercel deployment | `menubloc-frontend-l7pg7dpir-menuply.vercel.app` |
| Live bundle | `index-C18CZMc2.js` |

### Prior tip — meal board + Upcoming Plans (rollback target)

| Field | Value |
|-------|-------|
| Git commit | `ff5f3ea` |
| Vercel deployment | `menubloc-frontend-7ljmgxgm2-menuply.vercel.app` |
| Live bundle | `index-CdB7Wbvg.js` |

### Prior tip — Want video + Month in Food (rollback target)

| Field | Value |
|-------|-------|
| Deployment | `menubloc-frontend-ip7mqupae-menuply.vercel.app` |
| Bundle | `index-rdsNgKEW.js` |
| FE commit | `2e67796` |
| BE health | `f729764d` / later `00fe4885` |

### Prior tip — My Menuply Connects + Post about (rollback target)

| Field | Value |
|-------|-------|
| Deployment | `menubloc-frontend-gp1hon3it-menuply.vercel.app` |
| Bundle | `index-BshpJpXB.js` |
| FE commit | `9196bfc` |
| BE health | `8c4b9391` |

### Prior tip — owner diner roster column overlap (rollback target)

| Field | Value |
|-------|-------|
| Deployment | `menubloc-frontend-i5s4ory3h-menuply.vercel.app` |
| Bundle | `index-9GkHkqdL.js` |
| FE commit | `c090693` |
| BE health | `8c4b9391` |

### Prior tip — owner diner referral source (rollback target)

| Field | Value |
|-------|-------|
| Deployment | `menubloc-frontend-86va47zyv-menuply.vercel.app` |
| Bundle | `index-iiZW0hGa.js` |
| FE commit | `903f50e` |
| BE health | `49be028d` / later `8c4b9391` |

### Prior tip — My Menuply presentation + exhibit palette (rollback target)

| Field | Value |
|-------|-------|
| Deployment | `menubloc-frontend-9yjbhvqe2-menuply.vercel.app` |
| Bundle | `index-B4EE7_sD.js` |
| FE commit | `2108f37` |
| BE health | `ad3d097a` |

### Prior tip — 90-day eating look-back + Food Distributors footer (rollback target)

| Field | Value |
|-------|-------|
| Deployment | `menubloc-frontend-8zfz8l0px-menuply.vercel.app` |
| Bundle | `index-B855g_K3.js` |
| FE commit | `56c5d44` |
| BE health | `ad3d097a` |

### Prior tip — Ate post follow-up + diner visual cards (rollback target)

| Field | Value |
|-------|-------|
| Deployment | `menubloc-frontend-fuigm2qkl-menuply.vercel.app` |
| Bundle | `index-Dv-4gviG.js` |
| FE commit | `109e6fc` |
| BE health | `57e08927` / `f593a846` |

### Prior tip — Food social MVP Stages 1–2 (rollback target)

| Field | Value |
|-------|-------|
| Deployment | `menubloc-frontend-ns16qypm7-menuply.vercel.app` |
| Bundle | `index-BcsalcQZ.js` |
| FE commit | `fba813a` |
| BE health | `492dd058` |

---

## PREVIOUS LAST KNOWN GOOD (2026-08-19 — Food social MVP Stages 1–2)

### Frontend (menuply.com)

| Field | Value |
|-------|-------|
| Git commit | `fba813a` — Food social MVP Stages 1–2: Post sheet wiring, Events browse, I'm Eating At photos |
| Vercel deployment | `menubloc-frontend-ns16qypm7-menuply.vercel.app` |
| Live bundle | `index-BcsalcQZ.js` |

### Backend (Railway)

| Field | Value |
|-------|-------|
| Git on origin | `492dd058` |
| Live health SHA | `492dd0581c93258e3e82e9cea353ac7216c0bc75` |

### Prior tip — Future plans calendar events (rollback target)

| Field | Value |
|-------|-------|
| Deployment | `menubloc-frontend-4iy54g5qc-menuply.vercel.app` |
| Bundle | `index-6H0iynJH.js` |
| Commit | `1e18d55` |

---

## PREVIOUS LAST KNOWN GOOD (2026-08-18 — Future plans calendar events)

### Frontend (menuply.com)

| Field | Value |
|-------|-------|
| Authorized path | `/Users/andrebarber/Desktop/menubloc/menubloc-frontend-main` @ clean `main` |
| Git commit | `1e18d55` — Future plans calendar month view; clickable events; Restaurant [date] list |
| Vercel deployment | `menubloc-frontend-4iy54g5qc-menuply.vercel.app` |
| Live bundle | `index-6H0iynJH.js` |
| Aliases | `menuply.com`, `www.menuply.com`, `crm.menuply.com`, `venues.menuply.com` |
| Tip-gate | **PASS** (apex + www) verified 2026-08-18 after Future plans calendar events CPD |
| Feature | Calendar icon beside Future plans; month grid with clickable Restaurant [date] events; no Plans Scheduled toggle |

### Backend (Railway)

| Field | Value |
|-------|-------|
| Authorized path | `/Users/andrebarber/Desktop/menubloc/menubloc-backend-main` @ clean `main` |
| Git on origin | `06b8ff3f` — diner visible crews + Future Plans collapse LKG lock (`GET /dining-crews/for-diner/:dinerId`) |
| Live health SHA | `06b8ff3f6addd93762d98fe7d773239ffe0aabd3` |
| Health URL | `https://menubloc-backend-production.up.railway.app/health` |
| `commit_hash` | `06b8ff3f6addd93762d98fe7d773239ffe0aabd3` |
| Migrations | `0250`–`0272` applied; `0273` is in git (Join Me allow-list, since `a1b751c3`) — apply status not independently verified this CPD |
| Smoke | Health `06b8ff3f`; tip-gate PASS `4iy54g5qc` / `index-6H0iynJH.js` |

### Restore prior tip (Future plans only)

```bash
cd /Users/andrebarber/Desktop/menubloc/menubloc-frontend-main
npx vercel alias set menubloc-frontend-4iy54g5qc-menuply.vercel.app menuply.com
npx vercel alias set menubloc-frontend-4iy54g5qc-menuply.vercel.app www.menuply.com
npx vercel alias set menubloc-frontend-4iy54g5qc-menuply.vercel.app crm.menuply.com
npx vercel alias set menubloc-frontend-4iy54g5qc-menuply.vercel.app venues.menuply.com
bash ../../scripts/assert-menuply-production-tip.sh https://menuply.com
bash ../../scripts/assert-menuply-production-tip.sh https://www.menuply.com
```

---

## Correct deployment routes (ONLY defaults)

### Frontend

1. Directory: `menubloc-frontend-main`  
2. Branch: `main`  
3. Working tree: **clean**  
4. `npx vercel --prod --yes`  
5. Alias apex + www (+ crm / venues as needed)  
6. Tip gate PASS on apex + www  
7. Update **this contract**, tip-gate script locks, and `.cursor/rules/frontend-production-deploy-path-guardrail.mdc` together  

**Forbidden:** `menubloc-frontend/` (dirty mds), `_quarantine/frontend-deploy-forbidden/**`

### Backend

1. Path gate PASS on `menubloc-backend-main`  
2. Branch: `main`, tree **clean**  
3. Push `origin/main` (Railway auto-deploy) **or** `railway up` **only** from that directory  
4. `/health` `commit_hash` matches shipped SHA  
5. Apply scoped migrations/seeds only with `CONFIRM_PRODUCTION_TARGET=true` + `--allow-production`  

**Forbidden:** `menubloc-backend/` on `feature/billboard-multi-slot`, any dirty billboard checkout

### CPD meaning (“cpd”)

When Andre says **cpd**, agents must:

1. Commit on authorized clean `main` checkouts  
2. Push / deploy FE + BE as required by the feature  
3. Run tip-gate + health verify  
4. Update LKG locks in: tip-gate script · FE deploy guardrail · **this contract**  
5. Write `docs/deployments/YYYY-MM-DD_<topic>-cpd.md`  
6. Certify FE + BE deploy paths in the task response  

---

## Git checkpoint tags (code LKG — not tip aliases)

| Tag | Repo | SHA (at tag) | Meaning |
|-----|------|--------------|---------|
| `menuply-pre-video-first-consumer-2026-08-26` | FE + BE authorized mains | FE `89a336e` · BE `14a98b5c` | **Pre–video-first consumer shell** (`/feed`); tip `j2n2mx1ka` / `index-67tDDIer.js`; tags local until Andre push |
| `menuply-last-known-good-2026-08-18` | FE + BE authorized mains | FE `0450a53` · BE `fb54f0b4` | **Pre–My Menuply IA** (dining-hall human copy tip live; tags pushed) |
| `menuply-last-known-good-2026-08-14` | FE + BE authorized mains | FE `5c06c787` · BE `856d70dd` | Pre–Social Engine code checkpoint |
| `menuply-social-engine-known-good-2026-08-14` | FE + BE | FE `a89e0d6` · BE `b001e41e` | Pre–Social Onboarding |

These are **git** rollbacks. Live **Vercel tip** restore uses the deployment/bundle table below — not `git checkout` alone.

---

## Prior production tip restore points (do not restore unless Andre names them)

Newest superseded first. Restoring drops everything shipped after that tip.

| Deployment id | Bundle | Approx feature / CPD |
|---------------|--------|----------------------|
| `l7pg7dpir` | `index-C18CZMc2.js` | Camera slots + time-aware rows (`990fc76`) — superseded by getUserMedia camera `bm2jkijow` |
| `7ljmgxgm2` | `index-CdB7Wbvg.js` | Meal board + Upcoming Plans (`ff5f3ea`) — superseded by camera slots / time-aware rows `l7pg7dpir` |
| `ip7mqupae` | `index-rdsNgKEW.js` | Want video + Month in Food (`2e67796`) — superseded by meal board / Upcoming Plans `7ljmgxgm2` |
| `gp1hon3it` | `index-BshpJpXB.js` | Connects + Post about (`9196bfc`) — superseded by Want video / Month in Food `ip7mqupae` |
| `o8xa604sx` | `index-DZR4cTvb.js` | Future Plans collapse + crews (`ef9bb7a`) — superseded by calendar events `4iy54g5qc` |
| `89eyeudh1` | `index-DjXskZ76.js` | Join Me allow-list (`063ffd7`) — superseded by Future Plans collapse `o8xa604sx` |
| `3vk7ie3cf` | `index-He0r-RTw.js` | Post X bottom-nav align (`9cd7303`) — superseded by Join Me allow-list `89eyeudh1` |
| `bzddqa61v` | `index-DF-s_Lo_.js` | Diner-hub same-layout casual photos (`a7eb57d`) — never LKG-locked; superseded by `89eyeudh1` |
| `683cf6yk3` | `index-CZS4phIY.js` | My Menuply hub photos-first / want-to-eat / crew join (`e7c319b`) — superseded by Post X align `3vk7ie3cf` |
| `5vl6kfuh6` | `index-BZBfCuwA.js` | Owner diner accounts roster (`12945f5`) — superseded by My Menuply hub `683cf6yk3` |
| `psmauf4vh` | `index-WZh2e4sk.js` | Dish prefill + Post about (`8a1a961`) — superseded by owner diner accounts `5vl6kfuh6` |
| `n7gxy1luu` | `index-DbN-zhDW.js` | Eating-plans calendar + restaurant next-week count (`0d126d9`) — superseded by dish-prefill `psmauf4vh` |
| `lsmdx3d9x` | `index-C7QEDuzy.js` | Post-align Creators footer (`ea7eb4e`) — superseded by eating-plans `n7gxy1luu` |
| `1vjhrbfcc` | `index-DUbMTrel.js` | Nav restore without Post align / Creators (`a9b7365`) — superseded by `lsmdx3d9x` |
| `83npukyp6` | `index-KbRqQ3I0.js` | My Menuply hub (`c550dfd`) — superseded by bottom-nav restore |
| `2fw9x27jj` | `index-fjLns99U.js` | Dining-hall human copy (`98687fd`) — superseded by My Menuply `83npukyp6` |
| `ohxjeg0sj` | `index-DFFHQ6JS.js` | Diner sign-in invariant (`fc7e0f1`) — superseded by `74hi7bc73` |
| `3vre2srp8` | `index-DQKfgzho.js` | Add Menu contribution (`074a217`) — superseded |
| `30qbi67vq` | `index-CMXfgjwr.js` | Cluster landing consumer dashboard (`11e792e`) — superseded by `3vre2srp8` |
| `9ijik4t7p` | `index-HPBXNwnC.js` | Dining-hall status+comments lock (`a1ccafe`) — superseded by `30qbi67vq` |
| `37tsmprgc` | `index-HPBXNwnC.js` | Guest open reporting (`81b9bdd`) — superseded by `9ijik4t7p` |
| `1urgwayz1` | `index-FsvPkVHt.js` | Profile diner QR + Share My Menuply (`da0bb15`) — superseded by `37tsmprgc` |
| `nax94uq0u` | `index-DAjZPkYd.js` | Diner phone-verification token (`b8404e9`) — superseded by `1urgwayz1` |
| `kgtgek3l4` | `index-Br9O-thi.js` | Account dashboard four tabs (`2b0b024`) — superseded by `nax94uq0u` |
| `iyxv62rs6` | `index-6JpzKw-R.js` | Diner QR invitee connect copy (`7d5c7df`) — superseded by `kgtgek3l4` |
| `8pl3zm05l` | `index-DxsHvAHk.js` | What We Doing? Phase 1 (`4aff138`) — superseded by `iyxv62rs6` |
| `aj3cufw78` | `index-B2nAFBvm.js` | Diner QR invite connect + card (`d9d58fa`) — superseded by `8pl3zm05l` |
| `pvekgpaay` | `index-DOGT2NT-.js` | Diner Card promo + `/d` SPA scan (`0ed0a8a`) — superseded by `aj3cufw78` |
| `c07vv7d3s` | `index-BUPZP4ci.js` | About + diner signup copy (`f9b0535`) — superseded by `pvekgpaay` |
| `fnn23dmbl` | `index-UMv0E4Zu.js` | Phase 7 Meet Me Here (`9dec266`) — superseded by `c07vv7d3s` |
| `ro8l1scif` | `index-BVISDgrs.js` | Phase 5 Event Groups + diner-qr ShareModal null blank fix — superseded by `fnn23dmbl` |
| `hzs2u21r1` | `index-DfVlLYXq.js` | Venue Event Objects Phase 4 — superseded |
| `o3qnf739i` | `index-CxIJlzl-.js` | Venue Capability Phase 3 — superseded |
| `e2toazdpi` | `index-Cx2bTWAc.js` | diner-qr CORP blank + Invite align (`42c415b`) — superseded |
| `nzkm72fy0` | `index-DyvhJLLC.js` | Dining Crew invite ShareModal tip lock (`4ec654f`) — superseded by `e2toazdpi` |
| `aae62r0rr` | `index-CEl-scxL.js` | Waiter additive cluster updates (`2736d0c`) |
| `p1q70m1e8` | `index-xVp-udQI.js` | Diner onboarding guided introduction (`2eb3c23`) |
| `dkyh8n497` | `index-UoLq1e4f.js` | UCLA Place Westwood courtyard (`bd2e0a7`) |
| `8siyrjdn2` | `index-CTBCiaj0.js` | hide dead Google/Apple SSO |
| `8u2p5tci4` | `index-b_Ovc7EK.js` | USC/UCLA campus Place themes |
| `3ejgczu00` | `index-BrTJV97-.js` | Campus Dining |
| `a38ku52a4` | `index-BLw4kaBB.js` | All-profile readable white cards |
| `e9kop4og8` | `index-Di87A4Tc.js` | Social Onboarding text-invite |
| `1hqxwet9z` | `index-B0JBd4cG.js` | Pre text-invite onboarding |
| `6sk4due4f` | `index-D-I_Y4hm.js` | Social Onboarding (pre text-invite) |
| `4ru4hekmg` | `index-LSnxUvLR.js` | Profile readable surfaces |
| `5cd91e4s5` | `index-Cs95NUwq.js` | In-N-Out mobile splash-only |
| `gbli18jhr` | `index-BYCUQwwR.js` | In-N-Out splash logo centering |
| `ermw9wrlu` | `index-V7CvAska.js` | Dish photo clamps |
| `n0cvd9sri` | `index-CFRkrIiH.js` | Detail icons / Klaudette menu photos |
| `5crseazko` | `index-BJMGH4Bz.js` | Larger detail photo / hours |
| `1ac66vdd5` | `index-C9tZU1bB.js` | Compact sticky-hero dish photo |
| `p8hcw06bz` | `index-BcI_7aKO.js` | Dish photos desktop detail + search |
| `o7cgkvl22` | `index-D5A5vKki.js` | Dated Today hours all profiles |
| `hbxnqj1t3` | `index-CW_1SxW1.js` | Menu share menuply.com lock |
| `9jexq5xmv` | `index-DiSf7Eg5.js` | Public menu photo slot wrap |
| `99vcsavcl` | `index-BG0vkREZ.js` | Windows photo orientation |
| `ey3zs9v0a` | `index-COCr3wlP.js` | Owner+operator menu item photos |
| `om3o4bid8` | `index-DPIOa7vR.js` | ShareModal Copy Link primary |
| `dnpfzz326` | `index-DDTfE6hN.js` | Invite to Eat |
| `5bgthc6ie` | `index-BTCcz1Bv.js` | Food discussions MVP |
| `cmj2flhb5` | `index-CJWgOLqD.js` | Full SiteFooter hide (forbidden restore without confirmation) |
| `gltqad07l` | `index-shszZZc5.js` | Marketplace morning tip — NONSUBSCRIBER risk |
| `l0vcijcnl` | `index-CT17TZbQ.js` | Fine-only — drops Marketplace + Subscription Designer |

Full historical “do not restore” list also lives in `.cursor/rules/frontend-production-deploy-path-guardrail.mdc`.

---

## After every successful tip-gate PASS — update together

1. `scripts/assert-menuply-production-tip.sh` — `LOCKED_DEPLOY` + `LOCKED_BUNDLE`  
2. `.cursor/rules/frontend-production-deploy-path-guardrail.mdc` — Current production tip  
3. `docs/guardrails/2026-07-24_frontend-production-deploy-path-contract.md` — Locked live tip table  
4. **This file** — CURRENT LAST KNOWN GOOD section + prepend new row to prior tips  
5. **Mirrors:** copy this file to `menubloc-frontend-main/docs/guardrails/` and `menubloc-backend-main/docs/guardrails/` (stale mirrors have caused wrong restore targets)  
6. CPD under `docs/deployments/`  

If any of these disagree, treat tip-gate script + live `menuply.com` bundle as source of truth, then reconcile docs.

---

## Quick verify commands

```bash
# FE tip
bash scripts/assert-menuply-production-tip.sh https://menuply.com
bash scripts/assert-menuply-production-tip.sh https://www.menuply.com

# BE path + health
bash scripts/assert-backend-deploy-path.sh /Users/andrebarber/Desktop/menubloc/menubloc-backend-main
curl -sS https://menubloc-backend-production.up.railway.app/health

# Campus Dining smoke
curl -sS https://menubloc-backend-production.up.railway.app/public/clusters/usc/campus-dining
```

---

## Mandatory certifications (every task)

> ☐ FE DEPLOY PATH CERTIFICATION: …  
> ☐ BE DEPLOY PATH CERTIFICATION: …  

Full wording remains in the FE/BE path guardrail rules.
