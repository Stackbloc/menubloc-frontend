# Summary

Joe’s diner hub showed “No connections yet.” even after a mutual accepted Connection. The Connection page was passing an empty list. Every diner hub now shows **that diner’s** accepted connections (same layout as My Menuply). Tapping yourself opens My Menuply.

# Problem Statement

Andre: if I connect with Joe and Joe connects with me, Joe’s profile must list connections. Universal rule for all diners — not a special case.

# Root Cause

`ConsumerConnectionPeerPage` rendered `DinerIdentityHero` with `connections={[]}`. `GET /api/consumer/connections` only listed the viewer’s graph, not the hub diner’s.

# Evidence Collected

- Source: `connections={[]}` on the peer hub.
- My Menuply loads `listConnections()` for the owner and passes that list.
- Accepted pairs are mutual in `user_connections`; listing Joe’s accepted rows includes the viewer.

# Files Examined

- `ConsumerConnectionPeerPage.jsx`, `DinerIdentityHero.jsx`, `MyMenuplyPage.jsx`, `consumerApi.js`
- `consumerConnectionsService.js`, `connections.js`

# Database Queries Executed

None (no schema change). Uses existing `user_connections` accepted pairs.

# Changes Made

- `listConnections` accepts `peer_id`. If the viewer is an accepted Connection of that diner, returns **that diner’s** accepted connections (shaped from their point of view). Otherwise 403 `not_connected`. Pending of another diner is never returned.
- Peer hub loads that list. If production BE still ignores `peer_id` (old Railway SHA), FE falls back to showing the viewer so Joe is not blank.
- Connection name pills: other diners → their hub; yourself → `/my-menuply`.

# Commits

None this turn (not requested). Prior diner-hub FE `a7eb57d` / BE `7ccb2629` may already be on origin; this fix is additional uncommitted work.

# Deployment Status

**LOCAL.** Not CPD’d. Live Joe page still empty until next FE+BE CPD. Railway `/health` was still `942e7c10` at last check — full Joe list needs the new BE SHA live.

# Verification Results

FE: `connectionPeerHubContract`, `myMenuplyFourQuestionsContract`, `dinerAboutPhotosContract` PASS.  
BE: `consumerConnectionsContract`, `consumerConnectionsUnit` PASS.

# Remaining Risks

- Until BE is Railway-live, Joe’s list may only show you (fallback), not Joe’s other connections.
- Interrupted diner-hub CPD left aliases possibly on `bzddqa61v` / `index-DF-s_Lo_.js` without LKG lock update.

# Follow-Up Work

Say `cpd` to ship this with the diner hub. Confirm `/health` includes `peer_id` handling.

# Final Verdict

Universal diner-hub rule implemented locally: My Connections is always **that diner’s** accepted graph.
