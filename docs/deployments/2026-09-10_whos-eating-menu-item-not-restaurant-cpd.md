# CPD — Who's Eating dish label (menu item, not restaurant)

| | |
|--|--|
| **Date** | 2026-09-10 |
| **FE** | `menubloc-frontend-main` @ `78d17776` |
| **Tip** | `menubloc-frontend-73ap4z5bv-menuply.vercel.app` / `index-DJulZtfh.js` |
| **BE** | unchanged this ship (`7d68a5f8` tip-lock docs / prior feature `f37add40`) |
| **Tip-gate** | apex + www `RESULT=PASS` |

## Fix

Prefer `item_name` / menu item; never use a food label that equals the restaurant brand.

- Before: `is eating Yoshinoya at Yoshinoya`
- After: `is eating 2 Protein Bowl at Yoshinoya` (or `is eating at Yoshinoya` if no dish)

No clock time on Who's Eating rows (product decision).

## Verification

- Contract tests PASS
- Live formatter: dish ≠ restaurant brand when `item_name` present
- Tip-gate PASS
