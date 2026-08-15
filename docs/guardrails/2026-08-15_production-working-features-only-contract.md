# Production Working Features Only Contract

**Established:** 2026-08-15  
**Incident:** Consumer login/signup showed Google and Apple buttons on menuply.com while production OAuth was disabled / unconfigured — dead UI that looked like a product feature.  
**Type:** Hard product + engineering guardrail  
**Priority:** User trust — overrides “ship the shell now, wire later”

---

## Hard rule

**Do not put controls in production (or production-bound) UI for features that do not work.**

If a feature is not fully wired, configured, and verifiable in the target environment:

- Do **not** show its button, link, toggle, badge, or empty “coming soon” control that implies it works
- Do **not** leave disabled placeholders that look clickable or official (e.g. Google / Apple SSO with blank icons)
- Hide the control entirely until the feature is live

Silence, roadmap intent, “optional later,” or partial SDK mounts ≠ permission to show the control.

---

## Applies to

- Consumer auth (Google / Apple / SMS / etc.)
- Payment methods, share targets, marketplace actions, claim flows, Waiter/cluster affordances
- Any primary or secondary CTA that a user can reasonably expect to succeed

---

## Allowed without this contract’s “hide” rule

- Explicit **admin/diagnostics** tools clearly labeled as internal
- Local/dev-only UI behind `import.meta.env.DEV` (or equivalent) that never ships to menuply.com production tip
- Honest non-CTA copy that does not present a broken control (e.g. support docs)

---

## Required pattern

```
if (!featureConfiguredAndEnabled) return null; // do not render the control
```

For optional providers: gate on **both** frontend config (e.g. `VITE_*`) **and** backend enablement when the FE can know it. When FE can only see its own env, at minimum hide when FE config is missing.

---

## Agent stop line

> This change would ship or leave production UI for a feature that is not working in this environment. I have not done that. Working end-to-end behavior is required before the control is shown.

---

## Before adding optional / gated feature UI

Output:

> **Per Production Working Features Only Contract: the proposed change will add UI for [feature] that may be non-functional without [config/flags]. Explicit confirmation that the feature works in the target environment — or approval to hide until live — is required.**

Then stop until approved **or** implement hide-until-configured.

---

## Verification

A feature may appear in production UI only after:

1. End-to-end success path verified in that environment (or staging equivalent Andre accepts)
2. Failure modes do not leave a fake working control
3. Contract/regression test exists for “hidden when not configured” when the feature is optional

---

## Related fix (2026-08-15)

- `ConsumerAuthShared.jsx` — `SocialAuthSection` returns `null` when Google/Apple are not configured
- `test/consumerSocialAuthVisibilityContract.test.js`
