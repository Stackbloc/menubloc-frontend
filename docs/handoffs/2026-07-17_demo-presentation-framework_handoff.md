# Objective

Ship Menuply `/demo` presentation framework + full-bleed slide graphics from `~/Desktop/assets`.

# Current Status

**CPD IN PROGRESS**

# Files Changed

- `src/presentation/**` — engine, layouts, 26 slides, wired PNGs
- `src/App.jsx` — `/demo` → DemoPresentation; `/demo_menus` → DemoPage
- `src/pages/MenuDesignLabPage.jsx` — Demo windows → `/demo_menus`
- `docs/handoffs/2026-07-17_demo-presentation-framework_handoff.md`

# Database Changes

None.

# Decisions Made

- Full-bleed PNGs for most story slides; React layouts kept for 04, 19, 23–26 where no matching export
- No `graphic 19.png` in Desktop/assets — slide 19 stays React Everyone Wins
- Pricing variants graphic 23–25 skipped (duplicates of 22)

# Remaining Work

- Optional: drop Everyone Wins PNG for slide 19 when ready
- Nested Menu Lab sidebar nav remains local (not in this CPD)

# Risks / Known Issues

- Large PNGs (~35MB) in repo
- Slide 22 is plans art (replaces prior social-proof placeholder)

# Verification Status

- Assets exist for wired slides; App routes mount presentation

# Resume Instructions

1. Open https://menuply.com/demo after alias
2. Arrow through deck; confirm graphics on 03, 11–18, 20–22

# Git Status

FE `feature/mds-homepage-controls` — presentation CPD.
