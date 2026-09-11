# Camera / sheet overlay leftover — nav freeze (agent reference)

**Date:** 2026-09-11  
**Status:** **KNOWN PATTERN** — one confirmed instance (My Highlights). Other pickers not certified clear.  
**Not a hard guardrail.** Do not rewrite unrelated camera/compose paths unless Andre reports the same freeze.

**Incident (My Highlights):** diner profile Edit View → My Highlights + → pick photo/video → upload started immediately. After that, **Edit/Connect toggle and nearly all navigation buttons stopped working**.  
**Related work:** [`../audits/2026-09-11_profile-gallery-highlights-save-edit-meals.md`](../audits/2026-09-11_profile-gallery-highlights-save-edit-meals.md) · [`../handoffs/2026-09-11_profile-gallery-highlights-save-edit-meals_handoff.md`](../handoffs/2026-09-11_profile-gallery-highlights-save-edit-meals_handoff.md)

---

## When to open this file

Open this reference **before debugging** if a diner reports any of:

- After camera, library pick, or “Use video / Add / Post”, **taps do nothing**
- **Edit View / Connect View** glasses toggle dead
- Bottom nav (Home / Waiter / X / Profile) dead
- Page still **scrolls** (or does not) but **buttons look fine**
- Hard refresh **fixes** it; staying on the same SPA session does not
- DevTools shows a **full-viewport `position:fixed` node** still in the DOM after the picker “closed”

If those symptoms appear **after** a media picker, assume this pattern until proven otherwise. Do not first rewrite routing, auth, or Feed shell.

---

## Symptom vs lookalikes

| This pattern | Not this |
|--------------|----------|
| Overlay leftover: `position:fixed; inset:0` still covering the UI | Network hang (`identityBusy` / `postBusy` — buttons often look disabled) |
| z-index **above** Feed chrome (camera sheet is **13000**) | CSS `pointer-events: none` on a parent that was always that way |
| `document.body.style.overflow = "hidden"` never restored | Real JS error; React crash overlay |
| getUserMedia light still on after UI “closed” | Cause 2 / CSP / Supabase upload failure (video never saved) |

**z-index stack (Feed profile, 2026-09-11):**

| Surface | Typical z-index |
|---------|-----------------|
| `FeedPrimaryNav` (bottom) | **50** |
| `FeedMobileHeader` (glasses Edit/Connect) | **55** (`pointer-events: none` on header; children `auto`) |
| `ProfileGalleryComposeSheet` backdrop | **1100** |
| `ConsumerCameraSheet` overlay | **13000** |

A leftover camera overlay sits **above** Edit/Connect and bottom nav. Raising the toggle z-index is a **workaround**, not a fix.

---

## Root cause (reusable)

1. User captures or picks a file inside `MenuplyMediaPicker` → `ConsumerCameraSheet` (`open={sheetOpen}`).
2. Parent **immediately** calls `onFile` / starts **upload** and sets the compose sheet `open=false`.
3. Parent tree **unmounts** while the camera sheet is still closing (or never gets `onClose`).
4. Result: full-screen overlay and/or `body { overflow: hidden }` remain. Taps hit the invisible overlay.

Confirmed code path (pre-fix): `ProfileGalleryComposeSheet` `preferHighlight` called `onFile(file, { is_highlight: true })` **without** a preview/Save step; `MyMenuplyPage.onProfileMediaAdd` set `profileGalleryPickerOpen=false` then `await uploadConsumerProfileMedia(...)`.

---

## Confirmed instance (2026-09-11)

**Surface:** My Highlights + (profile Edit View and `/my-menuply/highlights`)  
**Fix (local at write time; CPD may still be pending):** stage file → close camera/sheet → **Save** in the section → then POST. Also `restoreDocumentScroll()` on close/save (`pendingHighlightMedia.js`).

Do **not** revert Highlights to immediate-upload-on-pick without re-reading this file.

---

## Other call sites to **check if the freeze returns**

These all mount `MenuplyMediaPicker` → `ConsumerCameraSheet`. **Not proven broken.** If nav dies after capture here, apply the same diagnosis.

| Call site | Notes |
|-----------|--------|
| `ProfileGalleryComposeSheet.jsx` | Highlights / former X “Profile gallery” — **fixed with stage+Save** |
| `AvatarComposeSheet.jsx` | Profile photo; closes after `onFile` |
| `EatingCompose.jsx` / `EatingMediaAttach.jsx` / `QuickCompose.jsx` | What I'm Eating / X compose |
| `EventComposeSheet.jsx` | My Events + |
| `PlanVideoAttachSheet.jsx` | Plan video |
| `HomeAtHomeSection.jsx` | @home photos |
| `FlashVideosBlock.jsx` | Flash Video |
| `DiningCrewsPage.jsx` | Crew food photo |
| `myMenuplyBits.jsx` | Shared picker |

Also check any sheet that sets `document.body.style.overflow = "hidden"` and unmounts on submit (calendar, X sheet, Feed more, ShareModal). Overflow-only leftover: page won’t scroll; overlay leftover: **taps** fail.

---

## Diagnose (browser, 2 minutes)

1. Reproduce: open picker → capture/pick → observe freeze.
2. Elements panel: search for a `div` with `position: fixed`, `inset: 0`, high z-index. If it exists after “close”, that is the overlay.
3. Computed `document.body.style.overflow` — if `hidden` after close, restore it.
4. Console: `document.querySelectorAll('[style*="13000"], [style*="z-index"]')` or look for `data-testid` on camera/compose sheets still mounted.
5. Hard refresh — if nav works again, it was session DOM/CSS, not a dead API.

---

## Safe fix (when Andre confirms this freeze)

Prefer this order:

1. **Close camera first** (`sheetOpen=false` / picker `onClose`) **before** parent unmounts the compose portal.
2. **Do not start upload** until the overlay is gone (preview + explicit **Save** / **Post** on a still-mounted page is the Highlights pattern).
3. On every sheet close/unmount: `document.body.style.overflow = ""` (see `restoreDocumentScroll` in `pendingHighlightMedia.js`).
4. Never “fix” by bumping Feed header/nav z-index above 13000 as the primary solution.

Do **not** modify Cause 2 diner video upload / CSP unless the freeze is proven to be that path. Highlights used `uploadConsumerProfileMedia` (Railway multipart), not Supabase PUT.

---

## What not to do

- Do not treat a one-off freeze as a reason to rewrite all `MenuplyMediaPicker` call sites without a report on that surface.
- Do not restore prior production tips because of this UI freeze.
- Do not hide SiteFooter or change Waiter / Home to “fix” dead taps.
- Do not assume the backend hung; the UI can look idle while an overlay eats pointer events.

---

## Next-agent checklist

- [ ] User reported freeze **after camera/library/picker**?
- [ ] Overlay or `overflow:hidden` leftover confirmed in DOM?
- [ ] Which compose sheet / `MenuplyMediaPicker` parent?
- [ ] Close overlay **before** upload; restore body overflow
- [ ] Re-test Edit/Connect + bottom nav **without** hard refresh
- [ ] Update this file’s “Confirmed instance” table if a **new** surface is proven
