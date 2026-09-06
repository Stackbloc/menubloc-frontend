# Profile hub: info vs media upload doors

**Date:** 2026-09-05  
**Status:** Product rule (implemented on My Menuply profile hub)

## Rule

| Surface | Job |
|--------|-----|
| **Feed / bottom-nav X** | Video (and media) **upload** — one door |
| **Profile (`/feed/profile`)** | **Info** upload (hobbies, favorites, school, about, etc.) + **display** of media already shared |

Do not place multiple duplicate camera icons on the profile that open the same video-upload capability as X.

## Stays on profile

- Avatar **photo** picker (identity still — not a Feed video clone)
- Profile details editor (structured info, one Save)
- Display of Flash clips, gallery, @home, What I'm Eating **after** they exist
- Owner delete / long-press cleanup on displayed media

## Removed from profile section titles / settings

- What I'm Eating title camera
- @home title camera / inline media picker
- Flash Video **upload** field inside profile details editor

## Empty-state guidance

Point diners to **Feed (X)** to share cooking / eating media; profile shows the result.

## Related

- `ProfileMediaGallery.jsx` — already display-only (add via X)
- `SectionEmptyState.jsx` — creation stays on X
- Contracts: `homeAtHomeProfileContract`, `flashVideoAboutMeContract`, `makeMeThisContract` (no `what-im-eating-camera`)
