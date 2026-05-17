# Top Picks Reactivation Plan

- Path: `menubloc-frontend/docs/planning/TOP_PICKS_REACTIVATION_PLAN_2026-05-17.md`
- Filename: `TOP_PICKS_REACTIVATION_PLAN_2026-05-17.md`
- Date: `2026-05-17`
- Purpose: Concise implementation plan for reintroducing a trustworthy public `Top Picks` system later.

## Purpose

`Top Picks` should surface genuinely useful nearby recommendations when Menuply has enough local menu coverage and enough behavior signal to rank options credibly.

## Why It Is Temporarily Disabled

The current market coverage and engagement signal density are not yet strong enough to support reliable recommendations across markets. Weak recommendations harm trust more than showing no recommendations.

## Minimum Reactivation Requirements

- Sufficient restaurant/menu density in a market to avoid repetitive or low-confidence results.
- Enough recent engagement events to rank beyond static popularity.
- Enough geo coverage to keep recommendations local and relevant.
- Enough MKS/Common Knowledge coverage to relate similar items across restaurants.

## Candidate Recommendation Signals

- menu engagement
- follows
- saves
- orders
- repeat orders
- geo proximity
- MKS similarity
- nutrition/preferences
- trending velocity

## Anti-Spam And Anti-Gaming

- Downweight low-quality or bursty activity from the same actor, device, or venue.
- Require minimum unique-user diversity before a signal materially affects ranking.
- Time-decay signals so stale popularity does not dominate.
- Keep manual boosts auditable and narrowly scoped.

## Phased Rollout

1. Internal-only scoring in a few dense markets with offline evaluation.
2. Hidden QA endpoint or admin preview to inspect ranked candidates and explanations.
3. Small public rollout in markets that meet density thresholds.
4. Expand only after trust, diversity, and relevance metrics hold.

## Relationship To MKS / Common Knowledge

`Top Picks` should eventually use MKS/Common Knowledge as the semantic layer for item similarity, cuisine/context understanding, and preference-aware ranking, rather than relying only on raw keyword or popularity signals.
