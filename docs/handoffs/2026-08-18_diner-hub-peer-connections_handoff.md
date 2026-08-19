# Objective

Every diner hub shows that diner’s Connections. Joe lists me when we are mutually connected.

# Current Status

**LOCAL** on authorized mains. Not CPD’d.

# Files Changed

- FE: `ConsumerConnectionPeerPage.jsx`, `DinerIdentityHero.jsx`, `MyMenuplyPage.jsx`, `consumerApi.js`, hub contracts
- BE: `consumerConnectionsService.js` `listConnections({ peerId })`, `connections.js` `peer_id`

# Database Changes

None.

# Decisions Made

- Same first-person “My Connections” on every diner hub.
- Viewer must already be an accepted Connection to read another diner’s list.
- Clicking your own pill on their hub goes to My Menuply.

# Remaining Work

CPD FE + BE. Railway must leave `942e7c10` for Joe’s full list (not just the viewer fallback).

# Risks / Known Issues

Interrupted previous CPD: menuply.com may already point at `bzddqa61v` / `index-DF-s_Lo_.js` while LKG still names Post X. Finish lock on next CPD.

# Verification Status

Contract tests PASS (see audit).

# Resume Instructions

Open `/account/connections/:joeId` while signed in as an accepted Connection. My Connections must include you. After BE is live it includes Joe’s other accepted diners too.

# Git Status

Uncommitted on `menubloc-frontend-main` and `menubloc-backend-main` (this fix on top of `a7eb57d` / `7ccb2629`).
