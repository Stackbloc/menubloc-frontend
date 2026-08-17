# Guest Open Reporting Contract

**Established:** 2026-08-17  
**Type:** Hard product + engineering guardrail  
**Principle:** Anyone can contribute. Accounts unlock identity and social features.

---

## Hard rule

A person does **not** need a Menuply account to contribute real-time operational information.

Guests can:

- Use **I'm Eating At**
- Select a restaurant, dining hall, or applicable venue
- Submit wait, seating/environment, and food/item availability signals
- Identify a menu item when applicable
- Submit an optional photo/comment where supported

The contribution is first-class intelligence on the **Restaurant → Dining Hall → Venue → Cluster** surfaces. Guest reporting is **not** a limited version of registered-diner reporting.

Registered diners can do the same **plus** identity-based social functions (Join Me, Dining Crew, responding to social invitations, personal activity history).

---

## Temporary anonymous session

Create/use a `guest_key` (local device session). This is **not** a Menuply account.

Use it only for:

- Rate limiting
- Duplicate prevention
- Abuse detection
- Report aggregation
- Confidence scoring

Never expose `guest_key`, `ip_hash`, or reporter coordinates to other users.

GPS is a **confidence signal**, not a gate.

---

## Registration prompt

Offer account creation **only after** a successful contribution. Do not interrupt reporting with sign-in.

---

## Never implement without explicit current-turn approval

- Login walls on I'm Eating At / diner-status / dining-hall / venue operational reports
- Inferior guest payloads (different tables, weaker public visibility, hidden from cluster intelligence)
- Registration before the report is live
- Public leakage of `guest_key` / `ip_hash` / reporter lat/lng
- Ungating Join Me / Dining Crew / invitation social / personal history

## Allowed without this contract’s reporting-auth approval

- Identity social (Join Me, Dining Crew, invitation RSVP, personal history) remaining `requireConsumerAuth`
- Abuse caps and duplicate windows on guest_key / IP
- After-success “Create a free account” copy

## Agent stop line

> This change would require an account to contribute useful real-world information, or would treat guest reports as inferior. I have not done that. Anyone can contribute; accounts unlock identity and social features.

## Before editing protected reporting auth files

Output:

> **Per Guest Open Reporting Contract: the proposed change will modify [names] and may require an account to contribute, or leak guest session identifiers. Explicit approval required.**

Then stop until approved.

Protected: `guestReporter.js`, `guestReporterSession.js`, `publicFoodActivity.js`, `publicDinerStatuses.js`, `foodActivityService.js` (create + places), `dinerStatusService.js` (create), `ImEatingPage.jsx`, `ImEatingAtPanel.jsx`, `DinerStatusPage.jsx`, `DinerStatusComposer.jsx`, `GuestContributeNextStep.jsx`, guest open-reporting contract tests.

Waiter files remain zero-touch unless the current turn names Waiter. Hedged “was reported…” copy belongs in `dinerStatusReportLines.js`.

## Mandatory on EVERY task completion

> ☐ GUEST REPORTING CERTIFICATION: Guest contribution [unchanged | implemented | user-approved change]; identity social still gated [yes | n/a]; registration prompt [after success | n/a].
