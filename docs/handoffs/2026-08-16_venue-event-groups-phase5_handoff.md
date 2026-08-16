# Objective

Ship Phase 5 Event Groups + social coordination. Skip Phase 6.

# Current Status

Implementation complete locally. Not CPD’d until asked.

# Files Changed

BE: `0261`, `venueEventGroupsService.js`, `routes/consumer/eventGroups.js`, `publicEvents.js`, capability package, tests.  
FE: `EventDetailPage.jsx`, `EventGroupDetailPage.jsx`, `App.jsx`, `consumerApi.js`, package page note, tests.

# Database Changes

`venue_event_rsvps`, `venue_event_groups`, `venue_event_group_members`, `venue_event_group_invitations`.

# Decisions Made

- Groups distinct from events; optional `dining_crew_id` link
- Public groups listed on event page; private membership lists hidden
- Phase 6 volume offers explicitly skipped (`group_offers` remains shell)

# Remaining Work

- CPD when Andre asks
- Phase 7 Meet Me Here (not started)

# Resume Instructions

1. Apply `0261` with `--allow-production`
2. Push BE + FE from authorized mains
3. Vercel alias + tip-gate

# Git Status

Pending commit in both authorized mains.
