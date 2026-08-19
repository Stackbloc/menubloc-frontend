# Diner Hub Systemwide Parity Contract

**Established:** 2026-08-19  
**Type:** Contract (social / diner profile surfaces)  
**Cursor rule:** `.cursor/rules/diner-hub-systemwide-parity-guardrail.mdc`  
**Related:** `docs/audits/2026-08-18_diner-hub-same-layout.md`, `test/connectionPeerHubContract.test.js`

---

## Principle

**One diner hub system.** My Menuply (owner) and Connection peer hubs (`/account/connections/:peerId`) are the same product layout and data presentation. Peer pages are **read-only** — not a separate design or a stub card.

Social-related UI, photo display, eating feed merge, and want-list rendering must ship **system-wide** in the same task, using shared modules.

---

## In-scope surfaces (must stay in parity)

| Surface | Route / file |
|---------|----------------|
| Owner hub | `MyMenuplyPage.jsx` → `/my-menuply` |
| Connection peer hub | `ConsumerConnectionPeerPage.jsx` → `/account/connections/:peerId` |
| Shared layout | `myMenuply/myMenuplyBits.jsx`, `DinerIdentityHero.jsx`, `dinerHubFormat.js` |
| Eating feed merge | `src/lib/eatingFeedMerge.js` |

---

## Required patterns

1. **Shared components first** — `PhotoGrid`, `WantToEatList`, `SectionHead`, `FuturePlanRow`, `mergeEatingFeedForHub`, `mapDiaryEntriesForHub`, `mapConnectionsEatingForHub` / `mapFoodActivityForHub`.
2. **Peer uses same merge** — diary + food activity via `mergeEatingFeedForHub`; never `diary.length ? diary : activity` either/or.
3. **Owner-only controls** — `QuickCompose`, `PostAfterActions`, avatar/media upload, plan scheduling. Peer omits compose; **display** must still match.

---

## Completion gate

Before marking diner-hub / social food work complete:

1. Update owner **and** peer pages (or shared module both use).
2. Run `npm run test:food-social-contract` in `menubloc-frontend-main` (includes `connectionPeerHubContract.test.js`).
3. Verify Connection peer hub manually (e.g. Joe Johnson) shows same photos/want cards as owner hub for that diner's visible data.

---

## Agent stop line

> This social/diner-hub change updates My Menuply only. Connection peer hubs must use the same shared system. I have not marked complete until peer parity and contract tests pass.
