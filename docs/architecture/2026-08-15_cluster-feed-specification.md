# Menuply Cluster Feed Specification

**Date:** 2026-08-15  
**Status:** Authoritative product + architecture contract  
**Scope:** Public Cluster Feed + Waiter consumption of the same public activity  
**Out of scope:** External event feeds · Crew Deals · separate Waiter activity engines

---

## Core concept

Every Menuply cluster has a **public Cluster Feed**.

The feed answers:

> **What's happening with food in this cluster right now?**

Anyone can view it. **Subscription is not required.**

**Waiter is separate.** Waiter is a private, personalized service that reports relevant information from the public feeds of clusters the user monitors.

### Architecture (mandatory)

```
Diner activity → Public Cluster Feed → Waiter → Subscribers
```

- One activity-generation path.
- Waiter must **not** create a duplicate activity stream.
- Public feed must **not** require auth or subscription.

---

## Product principle

The Cluster Feed is **not** primarily editorial.

**Diners are the reporting network.**

```
Diner eats → observes → posts status/photo/conversation/condition
  → Menuply associates activity with restaurant + food + cluster
  → Cluster Feed becomes more informative
  → Other diners discover what is happening
  → More diners use Menuply
```

---

## Sources (allowed)

### 1. Diner-generated food activity (primary)

| Source | Public feed? | Notes |
|--------|--------------|--------|
| Diner statuses | Yes (public) | Restaurant ± menu item |
| Food photos | Yes if `visibility=public` | Restaurant ± item ± cluster |
| Public conversations | Yes (public only) | Never private conversations |
| Dining conditions | Yes | Busy / lines / etc. + **timestamp**; decay when stale |
| Where diners are eating | Yes when activity supports it | Prefer “Popular with Menuply diners” — **never invent foot traffic** |
| Public Diner Crew activity | Yes when public | Never private membership / invites / private chats |

### 2. Menuply-maintained food data

New restaurants, dining halls, menus, items, reliable open/close, deals, other existing food events — **reuse existing systems**; do not duplicate stores just for the feed.

### 3. Food trends (architecture now; light aggregation later)

Aggregate later by recency, diner count, interactions, restaurant, item, category, cluster, status type. **Do not** ship a heavy recommendation engine in this phase.

### Explicitly excluded

- **External events** (campus concerts, sports, festivals) as a **required** feed dependency  
- Manual staff event-curation workflows  
- **Crew Deals**  
- Private conversations, private crews, private invites, private PII  

The feed must remain useful from **Menuply data + diner-generated food activity alone**.

---

## Freshness

Time-sensitive reports **must** carry a relative timestamp (e.g. “Reported 8 minutes ago”).

Do **not** present stale conditions as current.

Dining-condition / busy reports:

- Prefer relative age over implying “now”
- Decay in rank as they age
- Drop from the “current” board after a staleness window (implementation: **3 hours** for conditions)

---

## Public Cluster Feed vs Waiter

| | Public Cluster Feed | Waiter |
|--|---------------------|--------|
| Audience | Everyone | Signed-in subscriber |
| Scope | One cluster | Subscribed clusters only |
| Generation | Shared public builder | Same builder + subscription filter |
| Copy | Cluster-facing; no Waiter jargon required | May group by cluster |

---

## Public landing (consumer dashboard)

The **cluster page** is a quick overview a student can scan — not a dense report.

Order:

1. Cluster **name** + **brief** description  
2. **Day, date, and local time**  
3. **Today's Hotspots** — up to 10 restaurants with one related comment; link if there are more  
4. **Popular today** — menu items (never dining-hall SKUs)  
5. **Who's eating here** — diner comments, de-duplicated against hotspot lines  
6. **On campus** — campus eating options (status + comments on the place; no hall menus)  
7. **Events nearby** — published Menuply venue events today and upcoming within **30 miles**  

Omit empty sections. Full Food / Restaurants browse stays **below** the dashboard.

The Waiter path still consumes the shared food-activity **builder**. Events on the landing page are **not** injected into that builder.

---

## UX organization (Waiter / shared builder buckets)

Answer: **“What's happening with food here?”**

Not a raw DB activity log. Prefer useful buckets when populated:

- 🔥 Food Buzz  
- 🍽️ Where Diners Are Eating  
- 📸 Recent Food  
- 🗣️ What Diners Are Saying  
- 🏫 Dining Conditions  
- 👥 Diner Crew Activity (public only)  
- 🆕 New  

Omit empty sections. Prefer overview rows that read **without** opening a venue menu.

Copy rules:

- Do **not** claim “Everyone is eating here” without sufficient data  
- Prefer: Popular with Menuply diners · Getting attention today · Trending among Menuply diners · Most activity today  

---

## API (current)

- `GET /public/clusters/:slug/feed` — public, no auth  
- Waiter path consumes `getSubscribedClusterReportFeed` → same `buildClusterReportSection`

Hierarchy strings:

- Public: `diner_activity → public_cluster_feed`  
- Waiter: `diner_activity → public_cluster_feed → waiter`

---

## Implementation notes (2026-08-15)

**Shipped / aligned in this revision:**

- Shared builder; public photos gated `visibility='public'`
- No crew/conversation/invite leakage into builder queries
- No external-event source
- Section keys on items; relative `reported_ago` on time-sensitive rows
- Dining-condition staleness window
- Safe popularity wording
- FE landing: consumer dashboard (clock → hotspots → popular → comments); events nearby are a **separate** landing section, not a feed-builder source

**Deferred (architecture reserved, not required for feed to function):**

- Full dining-condition vocabulary (very busy / short line / …) beyond Busy + free-text notes  
- Public conversation → feed projection  
- Public crew activity → feed projection  
- Trend aggregation cards  
- Automated external event sources  

---

## Validation checklist

See `docs/audits/2026-08-15_cluster-feed-specification-alignment.md`.
