# Stripe Environment Protection Contract

**Date:** 2026-07-23  
**Status:** Mandatory — production safety (overrides ordinary implementation convenience)  
**Scope:** All AI agents, developers, scripts, tests, deployments, and automation working in the Menuply codebase  
**Authority:** Andre Barber — only Andre may authorize temporary production sandbox use

## 1. Default Rule

Menuply production must remain connected to the **Stripe live environment at all times**.

No agent may switch the live website, production backend, deployed environment, production database, production webhook configuration, or production environment variables to Stripe sandbox/test mode unless Andre Barber gives explicit permission for that specific task.

Silence, implied approval, prior approval, testing requirements, debugging convenience, or an agent’s technical judgment do not constitute permission.

## 2. Explicit Permission Required

Before changing any production Stripe configuration from live mode to sandbox/test mode, the agent must receive a direct instruction substantially equivalent to:

> “You have permission to temporarily switch the production Stripe environment to sandbox/test mode for this task.”

Permission applies only to the specific task for which it was granted.

It does not authorize:

* future sandbox use;
* unrelated testing;
* changing additional environments;
* leaving production in sandbox mode;
* changing live credentials permanently;
* replacing live webhook endpoints with test endpoints;
* modifying unrelated payment flows.

## 3. Preferred Testing Method

Agents must test Stripe work using isolated test infrastructure whenever technically possible.

Preferred methods include:

* local development with Stripe test keys;
* a dedicated preview deployment;
* a staging environment;
* separate sandbox environment variables;
* Stripe CLI webhook forwarding;
* mocked or simulated payment responses;
* automated tests that do not alter production configuration.

The production site must not be used as the default Stripe testing environment.

## 4. Production and Sandbox Must Be Isolated

Live and test Stripe configuration must remain separate.

At minimum, the system should distinguish:

* live publishable key;
* live secret key;
* live webhook secret;
* test publishable key;
* test secret key;
* test webhook secret;
* current application environment;
* current Stripe mode.

An agent must not overwrite live credentials with test credentials as a shortcut.

An agent must not store live and test credentials in the same variable without an explicit environment-selection mechanism.

## 5. Temporary Sandbox Authorization Procedure

When Andre explicitly authorizes temporary production sandbox use, the agent must perform all of the following:

### Before the change

1. Record the existing live configuration without exposing secret values.
2. Confirm which deployment or environment will be changed.
3. Confirm that the change is temporary.
4. Identify the exact live settings that must be restored.
5. Create a restoration checklist before testing begins.
6. Verify that unrelated live ordering paths will not be silently disabled.

### During the work

1. Display a clear warning in the agent’s working notes:

   **PRODUCTION STRIPE IS TEMPORARILY IN TEST MODE — RESTORATION REQUIRED**

2. Make only the minimum authorized Stripe changes.

3. Do not alter unrelated production environment variables.

4. Do not deploy other unrelated features while production is in test mode.

5. Continuously treat restoration as part of the same task, not as optional cleanup.

### Before declaring the work complete

The agent must restore:

* live publishable key selection;
* live secret key selection;
* live webhook secret selection;
* live Stripe Connect configuration;
* live payment-intent behavior;
* live checkout behavior;
* live deployment environment variables;
* any live webhook endpoint changed during testing;
* any production feature flags changed for sandbox testing.

## 6. Mandatory Live-Mode Verification

An agent may not state that Stripe work is complete until it has verified that production is back in live mode.

Verification must include, where technically available:

1. Confirm the production environment is selecting live Stripe credentials.
2. Confirm the publishable key begins with the expected live-key prefix.
3. Confirm the backend is selecting the live secret-key configuration without displaying the secret.
4. Confirm production webhook configuration uses the live webhook secret.
5. Confirm the deployed application reports or logs the expected Stripe mode.
6. Confirm no production environment variable still points to test mode.
7. Confirm no temporary sandbox feature flag remains enabled.
8. Run a non-destructive production payment-path smoke test.
9. Verify that the live ordering interface does not display test-mode indicators.
10. Report the final Stripe mode explicitly.

Required completion statement:

> “Stripe production configuration has been restored and independently verified as live. No temporary sandbox configuration remains active.”

If that statement cannot truthfully be made, the task is not complete.

## 7. Restoration Applies During Every Phase

The obligation to preserve or restore live mode applies during:

* investigation;
* coding;
* testing;
* debugging;
* deployment;
* rollback;
* agent handoff;
* context-window exhaustion;
* interrupted work;
* failed implementation;
* partial completion;
* final completion;
* session termination.

An agent may not leave production in sandbox mode because:

* testing is unfinished;
* another agent will continue the work;
* deployment failed;
* the session is ending;
* the agent encountered an unrelated error;
* the implementation was reverted;
* the user stopped responding;
* the agent believes sandbox mode is safer.

If work cannot continue, the agent must restore live mode before stopping.

## 8. Multi-Agent Rule

No agent may assume another agent will restore Stripe configuration.

The agent that changes production to sandbox mode remains responsible for restoring it.

Before handing work to another agent, the current agent must either:

* restore production to live mode and verify it; or
* obtain explicit authorization from Andre to transfer restoration responsibility.

A handoff note alone does not satisfy the restoration requirement.

## 9. Prohibited Actions

Agents must not:

* switch production Stripe to sandbox without explicit permission;
* toggle the Stripe Dashboard account mode merely to test application code;
* replace production keys with test keys without recording the original configuration;
* commit Stripe secret keys to the repository;
* expose Stripe secret values in logs, chat, screenshots, documentation, or commits;
* leave production in test mode after testing;
* deploy code that selects test mode by default;
* make test mode the fallback when Stripe configuration is missing;
* silently disable live checkout;
* conflate application sandbox mode with the Stripe Dashboard display toggle;
* declare success without verifying the deployed production environment;
* assume a code revert automatically restores deployment environment variables;
* assume that restoring keys alone restores webhooks, Connect settings, or feature flags.

## 10. Fail-Closed Configuration Rule

Production must fail visibly rather than silently falling back to sandbox.

The application must never contain logic equivalent to:

```text
If live Stripe configuration is missing, use Stripe test configuration.
```

Required behavior:

```text
If production is missing valid live Stripe configuration:
- stop the payment operation;
- emit a clear configuration error;
- preserve the rest of the site when possible;
- never substitute test credentials automatically.
```

## 11. Recommended Application Guard

The production application should enforce a runtime assertion substantially equivalent to:

```javascript
if (process.env.NODE_ENV === "production") {
  if (process.env.STRIPE_MODE !== "live") {
    throw new Error(
      "Production Stripe safety violation: STRIPE_MODE must be live."
    );
  }

  if (!process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_")) {
    throw new Error(
      "Production Stripe safety violation: live secret key is required."
    );
  }

  if (!process.env.STRIPE_PUBLISHABLE_KEY?.startsWith("pk_live_")) {
    throw new Error(
      "Production Stripe safety violation: live publishable key is required."
    );
  }
}
```

Equivalent protection may be implemented differently, but production must not start payment processing with Stripe test credentials.

## 12. Agent Stop Condition

If an agent believes production sandbox access is necessary but explicit permission has not been given, the agent must stop before making the change and report:

> “This task appears to require temporarily changing production Stripe configuration. I have not made that change because explicit authorization is required. I will use local, preview, staging, mocked, or Stripe CLI testing instead.”

## 13. Definition of Done

Stripe-related work is complete only when:

* the requested implementation is finished;
* relevant tests pass;
* production remains or has been restored to live mode;
* live and test environments remain isolated;
* temporary keys, flags, endpoints, and configuration are removed;
* deployment status is verified;
* the payment path receives a non-destructive smoke test;
* the final Stripe mode is explicitly reported.

Failure to restore and verify live mode is a production incident, not a minor unfinished task.

## Before changing production Stripe / payment env vars

Output:

> **Per Stripe Environment Protection Contract: the proposed change will modify [names] and may alter production Stripe live/sandbox mode. Explicit Andre authorization required.**

Then **stop** until Andre gives the exact temporary-sandbox permission language (or confirms the change keeps live mode).

## Protected surfaces (non-exhaustive)

- Railway / Vercel production env vars: `STRIPE_*`, `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_*`, Connect-related secrets
- Production Stripe Dashboard webhook endpoints and Connect platform settings
- `menubloc-backend/src/services/payments/*`
- Checkout / payment-intent / webhook routes that select Stripe credentials
- Scripts or deploys that set production Stripe mode or keys

## Cursor rule

`.cursor/rules/stripe-environment-protection-guardrail.mdc` (alwaysApply)
