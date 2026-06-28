# Home Page Protection Protocol (HPP)

**Status:** ACTIVE — P0 (highest)  
**Established:** 2026-06-28  
**Applies to:** All agents, all frontend tasks, all deployments  
**Authoritative design reference:** [../architecture/2026-06-28_AUTHORITATIVE-HOME-PAGE-DESIGN.md](../architecture/2026-06-28_AUTHORITATIVE-HOME-PAGE-DESIGN.md)

---

## Hard rule

The Menuply production home page (`HomeNext` at `/`) is a **protected product asset**. It is **NOT** to be modified unless the product owner gives **explicit instruction** to change the home page.

If a task does not mention the home page:

**The home page is off limits.**

---

## Protected scope

Unless explicitly authorized, agents SHALL NOT modify:

- Home page layout, visual hierarchy, spacing, typography, colors
- Search bar placement; chip placement, ordering, sizing, styling, spacing
- Health Goals section; menu sections; section ordering; menu card presentation
- Location selector placement; home routing; animations; responsive layout
- Header spacing; footer behavior; component structure; home CSS/state/data flow

This applies whether the change is intentional or incidental.

---

## Explicitly forbidden

- “Improve,” “modernize,” “clean up,” “simplify,” “refactor,” or “standardize” the home page
- Change spacing/CSS for consistency with other pages without approval
- Reuse home components elsewhere if doing so changes home behavior

If a task would require any home page modification: **STOP.** Do not proceed without approval.

---

## Incidental changes (shared code)

Search, Waiter, Food Navigation, location services, chip components, theme, and shared UI must **not** alter the authoritative home page.

Either **isolate** the change or **obtain explicit approval** before modifying protected home files.

---

## Before editing protected home files

Output:

> **Per Home Page Protection Protocol: the proposed change will modify [file names] and may alter the authoritative Menuply home page (`HomeNext`). Explicit product-owner approval required.**

---

## Release gate — Home Page Certification

Every commit/PR/deploy must state **one** of:

**Option A:** I certify that this work made **NO** changes to the Menuply home page.

**Option B:** I certify that the following home page changes were **explicitly requested** by the product owner: [list every modification].

---

## PR requirement

## Home Page Impact

☐ No home page impact.  
☐ Home page modified with explicit product-owner approval.

---

## Future PHMS recommendation

Add a PHMS/UI regression check detecting unexpected changes to home DOM structure, component tree, critical CSS classes, and key protected elements. Unexpected diffs → release warning.

---

## Standing rule

Platform evolution occurs **around** the home page unless the home page itself is the subject of the work.
